/*
 * Allmighty Docker Manager - https://github.com/RyanTheAllmighty/Allmighty-Docker-Manager
 * Copyright (C) 2015 RyanTheAllmighty
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

"use strict";

var brain = require('../brain');

var fs = require('fs');
var tmp = require('tmp');
var path = require("path");
var fstream = require("fstream");
var spawn = require('child_process').spawn;
var sprintf = require("sprintf-js").sprintf;

// Symbol for storing the objects properties
var objectSymbol = Symbol();

module.exports = class Component {
    /**
     * Constructor to create a new Component.
     *
     * @param {String} name - the name of this component
     */
    constructor(name) {
        this[objectSymbol] = {
            name
        };
    }

    /**
     * Gets the path to the folder where this component is stored.
     *
     * @returns {String}
     */
    get directory() {
        return path.join(brain.getBaseDirectory(), brain.settings.directories.components, this.name);
    }

    /**
     * Gets the name of this component.
     *
     * @returns {String}
     */
    get name() {
        return this[objectSymbol].name;
    }

    /**
     * Gets the tag name for this component, used as the tag name when building and pushing.
     *
     * @returns {String}
     */
    get tagName() {
        return sprintf('%s/%s', brain.settings.repositoryURL, this.name);
    }

    /**
     * Builds this component into a Docker image.
     *
     * @param {Object} options - options passed in from the user
     * @param {Component~buildCallback} callback - the callback for when we're done
     */
    build(options, callback) {
        console.log('Started build for ' + this.name);
        var buildOpts = {
            t: this.tagName
        };

        if (options.noCache) {
            buildOpts.nocache = true;
        }

        var self = this;

        tmp.file(function (err, path, fd, cleanupCallback) {
            if (err) {
                cleanupCallback();

                return callback(err);
            }

            let tarArgs = [
                '-cf',
                path,
                '-C',
                self.directory,
                '.'
            ];

            var tarPS = spawn('tar', tarArgs);

            tarPS.on('close', function (code) {
                if (code !== 0) {
                    return callback(new Error('A non 0 exit code! ' + code + ' was returned when trying to tar the folder!'));
                }

                brain.docker.buildImage(path, buildOpts, function (err, stream) {
                    if (err || stream === null) {
                        console.log('Error building ' + self.name);
                        return callback(err);
                    }

                    brain.docker.modem.followProgress(stream, function (err, output) {
                        console.log('Finished build for ' + self.name);
                        callback(err, output);
                    }, function (progress) {
                        if (progress) {
                            if (progress.error) {
                                return callback(new Error(progress.error.errorDetail.message));
                            }

                            if (!options.quiet) {
                                if (progress.stream) {
                                    process.stdout.write(progress.stream);
                                }
                            }
                        }
                    });
                });
            });
        });
    }

    /**
     * Pulls this component from the repository defined in the settings.
     *
     * @param {Object} options - options passed in from the user
     * @param {Component~pullCallback} callback - the callback for when we're done
     */
    pull(options, callback) {
        if (!brain.settings.repositoryAuth) {
            return callback(new Error('No repository auth is set in the settings.json file!'));
        }

        console.log('Started pull for ' + this.name);

        var self = this;
        brain.docker.pull(this.tagName, {authconfig: brain.settings.repositoryAuth}, function (err, stream) {
            if (err || stream === null) {
                console.log('Error pulling ' + self.name);
                return callback(err);
            }
            brain.docker.modem.followProgress(stream, function (err, output) {
                console.log('Finished pull for ' + self.name);
                callback(err, output);
            }, function (progress) {
                if (progress) {
                    if (progress.error) {
                        return callback(new Error(progress.error.errorDetail.message));
                    }

                    if (!options.quiet) {
                        if (progress.stream) {
                            process.stdout.write(progress.stream);
                        }
                    }
                }
            });
        });
    }

    /**
     * Pushes this built component to the repository defined in the settings.
     *
     * @param {Object} options - options passed in from the user
     * @param {Component~pushCallback} callback - the callback for when we're done
     */
    push(options, callback) {
        if (!brain.settings.repositoryAuth) {
            return callback(new Error('No repository auth is set in the settings.json file!'));
        }

        console.log('Started push for ' + this.name);

        var self = this;
        brain.docker.getImage(this.tagName).push({authconfig: brain.settings.repositoryAuth}, function (err, stream) {
            if (err || stream === null) {
                console.log('Error pushing ' + self.name);
                return callback(err);
            }

            brain.docker.modem.followProgress(stream, function (err, output) {
                console.log('Finished push for ' + self.name);
                callback(err, output);
            }, function (progress) {
                if (progress) {
                    if (progress.error) {
                        return callback(new Error(progress.error.errorDetail.message));
                    }

                    if (!options.quiet) {
                        if (progress.stream) {
                            process.stdout.write(progress.stream);
                        }
                    }
                }
            });
        });
    }
};

/**
 * This is the callback used when building a component.
 *
 * @callback Component~buildCallback
 * @param {Error|undefined} err - the error (if any) that occurred while trying to build a component
 */

/**
 * This is the callback used when pulling a component.
 *
 * @callback Component~pullCallback
 * @param {Error|undefined} err - the error (if any) that occurred while trying to pull a component
 */

/**
 * This is the callback used when pushing a component.
 *
 * @callback Component~pushCallback
 * @param {Error|undefined} err - the error (if any) that occurred while trying to push a component
 */
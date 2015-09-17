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

// Load the brain in for the application
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
    constructor(name) {
        this[objectSymbol] = {
            name
        };
    }

    get name() {
        return this[objectSymbol].name;
    }

    get directory() {
        return path.join(brain.getBaseDirectory(), brain.settings.directories.components, this.name);
    }

    get tagName() {
        return sprintf('%s/%s', brain.settings.repositoryURL, this.name);
    }

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
                        if (!options.quiet && progress && progress.stream) {
                            process.stdout.write(progress.stream);
                        }
                    });
                });
            });
        });
    }

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
            });
        });
    }

    push(options, callback) {
        if (!brain.settings.repositoryAuth) {
            return callback(new Error('No repository auth is set in the settings.json file!'));
        }

        console.log('Started push for ' + this.name);

        var self = this;
        brain.docker.push(this.tagName, {authconfig: brain.settings.repositoryAuth}, function (err, stream) {
            if (err || stream === null) {
                console.log('Error pushing ' + self.name);
                return callback(err);
            }

            brain.docker.modem.followProgress(stream, function (err, output) {
                console.log('Finished push for ' + self.name);
                callback(err, output);
            });
        });
    }
};
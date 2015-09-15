"use strict";

// Load the brain in for the application
var brain = require('../brain');

var fs = require('fs');
var tar = require('tar');
var tmp = require('tmp');
var path = require("path");
var fstream = require("fstream");
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

            function onError(err) {
                cleanupCallback();

                callback(err);
            }

            function onEnd() {
                brain.docker.buildImage(path, buildOpts, function (err, stream) {
                    if (err || stream === null) {
                        console.log('Error building ' + self.name);
                        return callback(err);
                    }

                    brain.docker.modem.followProgress(stream, function (err, output) {
                        console.log('Finished build for ' + self.name);
                        callback(err, output);
                    }, function (progress) {
                        if (!options.quiet && progress.stream) {
                            process.stdout.write(progress.stream);
                        }
                    });
                });
            }

            fstream.Reader({
                path: self.directory,
                type: "Directory"
            }).on('error', onError).pipe(tar.Pack({
                fromBase: true,
                noProprietary: true
            }).on('error', onError).on('end', onEnd)).pipe(fs.createWriteStream(path));
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
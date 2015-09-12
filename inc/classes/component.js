"use strict";

var fs = require('fs');
var tar = require('tar');
var tmp = require('tmp');
var path = require("path");
var fstream = require("fstream");
var sprintf = require("sprintf-js").sprintf;

// Load the brain in for the application
var brain = require('../brain');

module.exports = class Component {
    constructor(name) {
        this.name = name;
    }

    getName() {
        return this.name;
    }

    getDirectory() {
        return path.join(brain.getBaseDirectory(), brain.settings.directories.components, this.name);
    }

    getTagName() {
        return sprintf('%s/%s', brain.settings.repositoryURL, this.name);
    }

    build() {
        console.log('Started build for ' + this.getName());
        var buildOpts = {
            t: this.getTagName()
        };

        if (options.noCache) {
            buildOpts['nocache'] = true;
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
                    if (err || stream == null) {
                        console.log('Error building ' + self.getName());
                        return callback(err);
                    }

                    brain.docker.modem.followProgress(stream, function (err, output) {
                        console.log('Finished build for ' + self.getName());
                        callback(err, output);
                    }, function (progress) {
                        if (!options.quiet) {
                            process.stdout.write(progress.stream);
                        }
                    });
                });
            }

            fstream.Reader({
                path: self.getDirectory(),
                type: "Directory"
            }).on('error', onError).pipe(tar.Pack({
                fromBase: true,
                noProprietary: true
            }).on('error', onError).on('end', onEnd)).pipe(fs.createWriteStream(path));
        });
    }
};
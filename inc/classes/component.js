var fs = require('fs');
var tar = require('tar');
var tmp = require('tmp');
var path = require("path");
var fstream = require("fstream");
var sprintf = require("sprintf-js").sprintf;

// Load the brain in for the application
var brain = require('../brain');

var methods = Component.prototype;

function Component(name) {
    this.name = name;
}

methods.getName = function () {
    return this.name;
};

methods.getDirectory = function () {
    return path.join(brain.getBaseDirectory(), brain.settings.directories.components, this.name);
};

methods.getTagName = function () {
    return sprintf('%s/%s', brain.settings.repositoryURL, this.name);
};

methods.build = function (options, callback) {
    var buildOpts = {
        t: this.getTagName()
    };

    if (options.noCache) {
        buildOpts['nocache'] = true;
    }

    var obj = this;
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
                brain.docker.modem.followProgress(stream, function (err, output) {
                    callback(err, output);
                }, function (progress) {
                    if (!options.quiet) {
                        process.stdout.write(progress.stream);
                    }
                });
            });
        }

        fstream.Reader({
            path: obj.getDirectory(),
            type: "Directory"
        }).on('error', onError).pipe(tar.Pack({
            fromBase: true,
            noProprietary: true
        }).on('error', onError).on('end', onEnd)).pipe(fs.createWriteStream(path));
    });
};

module.exports = Component;
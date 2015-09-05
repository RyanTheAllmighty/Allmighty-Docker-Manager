var docker = require('../docker');

var fs = require('fs');
var _ = require('lodash');
var path = require('path');
var async = require('async');
var merge = require('merge');
var sprintf = require("sprintf-js").sprintf;

module.exports.run = function (arguments, callback) {
    // Check if we have any more arguments
    if (arguments._ && arguments._.length > 0) {
        // Yup, so lets build this single component
        var name = arguments._.shift();

        if (!docker.isComponentSync(name)) {
            return callback({
                code: 1,
                error: 'No component exists called "' + name + '"!'
            });
        }

        build(name, arguments, function (res) {
            if (res.code != 0) {
                console.log(res.error);
            }

            callback(res);
        });
    } else {
        if (arguments.async) {
            delete arguments.async;

            buildAll(arguments, function (res) {
                if (res.code != 0) {
                    console.log(res.error);
                }

                callback(res);
            });
        } else {
            buildAllSync(arguments, function (res) {
                if (res.code != 0) {
                    console.log(res.error);
                }

                callback(res);
            });
        }
    }
};

function build(name, opts, callback) {
    var options = merge({
        noCache: false
    }, opts);

    docker.isBuildable(name, function (buildable) {
        if (!buildable) {
            callback({
                code: 1,
                error: 'Cannot build ' + name + '!'
            });
        }

        var arguments = [];

        arguments.push('build');
        arguments.push('--rm');

        if (options.noCache) {
            arguments.push('--no-cache=true');
        }

        arguments.push(sprintf('--tag="%s/%s"', docker.settings.repositoryURL, name));
        arguments.push(docker.getBuildDirectory(name));

        docker.spawnDockerProcess(arguments, callback);
    });
}

function buildAll(opts, callback) {
    var builds = fs.readdirSync(docker.getBuildsDirectory()).filter(function (file) {
        return fs.statSync(path.join(docker.getBuildsDirectory(), file)).isDirectory();
    });

    async.each(builds, function (name, next) {
        build(name, opts, function (res) {
            // Check for failure
            if (res.code != 0) {
                next(res);
            }

            next()
        });
    }, function (err) {
        if (err) {
            callback(err);
        }

        callback({
            code: 0
        })
    });
}

function buildAllSync(opts, callback) {
    var builds = fs.readdirSync(docker.getBuildsDirectory()).filter(function (file) {
        return fs.statSync(path.join(docker.getBuildsDirectory(), file)).isDirectory();
    });

    async.eachSeries(builds, function (name, next) {
        build(name, opts, function (res) {
            // Check for failure
            if (res.code != 0) {
                next(res);
            }

            next()
        });
    }, function (err) {
        if (err) {
            callback(err);
        }

        callback({
            code: 0
        })
    });
}
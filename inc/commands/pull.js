var docker = require('../docker');

var fs = require('fs');
var _ = require('lodash');
var path = require('path');
var async = require('async');
var merge = require('merge');
var spawn = require('child_process').spawn;
var sprintf = require("sprintf-js").sprintf;

module.exports.run = function (arguments, callback) {
    // Check if we have any more arguments
    if (arguments._ && arguments._.length > 0) {
        // Yup, so lets pull this single component
        pull(arguments._.shift(), arguments, function (res) {
            if (res.code != 0) {
                console.log(res.error);
            }

            callback(res);
        });
    } else {
        if (arguments.async) {
            delete arguments.async;

            pullAll(arguments, function (res) {
                if (res.code != 0) {
                    console.log(res.error);
                }

                callback(res);
            });
        } else {
            pullAllSync(arguments, function (res) {
                if (res.code != 0) {
                    console.log(res.error);
                }

                callback(res);
            });
        }
    }
};

function pull(name, opts, callback) {
    var options = merge({}, opts);

    docker.isBuildable(name, function (buildable) {
        if (!buildable) {
            callback({
                code: 1,
                error: 'Cannot pull ' + name + '!'
            });
        }

        var arguments = [];
        arguments.push('pull');
        arguments.push(sprintf('%s/%s', docker.settings.repositoryURL, name));

        docker.spawnDockerProcess(arguments, callback);
    });
}

function pullAll(opts, callback) {
    var builds = fs.readdirSync(docker.getBuildsDirectory()).filter(function (file) {
        return fs.statSync(path.join(docker.getBuildsDirectory(), file)).isDirectory();
    });

    async.each(builds, function (name, next) {
        pull(name, opts, function (res) {
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

function pullAllSync(opts, callback) {
    var builds = fs.readdirSync(docker.getBuildsDirectory()).filter(function (file) {
        return fs.statSync(path.join(docker.getBuildsDirectory(), file)).isDirectory();
    });

    async.eachSeries(builds, function (name, next) {
        pull(name, opts, function (res) {
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
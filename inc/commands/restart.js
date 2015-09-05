var docker = require('../docker');

var fs = require('fs');
var _ = require('lodash');
var path = require('path');
var async = require('async');
var merge = require('merge');
var sprintf = require("sprintf-js").sprintf;

module.exports.run = function (arguments, callback) {
    var args = arguments;

    docker.getRunningContainerNames(function (err, containers) {
        if (err) {
            return callback({
                code: 1,
                error: err
            });
        }

        if (containers.length == 0) {
            return callback({
                code: 1,
                error: 'There are no running containers!'
            });
        }

        // Check if we have any more arguments
        if (args._ && args._.length > 0) {
            // Yup, so lets restart this single application
            var name = args._.shift();

            if (!docker.isApplicationSync(name)) {
                return callback({
                    code: 1,
                    error: 'No application exists called "' + name + '"!'
                });
            }

            var isUp = _.some(containers, function (container) {
                return container == name || container.startsWith(name + "_");
            });

            if (!isUp) {
                return callback({
                    code: 1,
                    error: 'There are no running containers for the application "' + name + '"!'
                });
            }

            restart(name, args, function (res) {
                if (res.code != 0) {
                    console.log(res.error);
                }

                callback(res);
            });
        } else {
            if (args.async) {
                delete args.async;

                restartAll(args, function (res) {
                    if (res.code != 0) {
                        console.log(res.error);
                    }

                    callback(res);
                });
            } else {
                restartAllSync(args, function (res) {
                    if (res.code != 0) {
                        console.log(res.error);
                    }

                    callback(res);
                });
            }
        }
    });
};

function restart(name, opts, callback) {
    var options = merge({}, opts);

    var arguments = [];

    arguments.push('-f');
    arguments.push(docker.getDockerComposeYML(name));
    arguments.push('-p');
    arguments.push(name);
    arguments.push('restart');

    docker.spawnDockerComposeProcess(arguments, callback);
}

function restartAll(opts, callback) {
    var applications = fs.readdirSync(docker.getApplicationsDirectory()).filter(function (file) {
        return file.substr(-4) == '.yml';
    });

    applications = _.map(applications, function (app) {
        return app.substr(0, app.length - 4);
    });

    async.each(applications, function (name, next) {
        restart(name, opts, function (res) {
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

function restartAllSync(opts, callback) {
    var applications = fs.readdirSync(docker.getApplicationsDirectory()).filter(function (file) {
        return file.substr(-4) == '.yml';
    });

    applications = _.map(applications, function (app) {
        return app.substr(0, app.length - 4);
    });

    async.eachSeries(applications, function (name, next) {
        restart(name, opts, function (res) {
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
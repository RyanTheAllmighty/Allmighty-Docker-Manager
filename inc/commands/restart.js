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
        // Yup, so lets restart this single application
        restart(arguments._.shift(), arguments, function (res) {
            if (res.code != 0) {
                console.log(res.error);
            }

            callback(res);
        });
    } else {
        if (arguments.async) {
            delete arguments.async;

            restartAll(arguments, function (res) {
                if (res.code != 0) {
                    console.log(res.error);
                }

                callback(res);
            });
        } else {
            restartAllSync(arguments, function (res) {
                if (res.code != 0) {
                    console.log(res.error);
                }

                callback(res);
            });
        }
    }
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
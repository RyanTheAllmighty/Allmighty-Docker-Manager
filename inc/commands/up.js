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
        // Yup, so lets bring up this single application
        var name = arguments._.shift();

        if (!docker.isApplicationSync(name)) {
            return callback({
                code: 1,
                error: 'No application exists called "' + name + '"!'
            });
        }

        up(name, arguments, function (res) {
            if (res.code != 0) {
                console.log(res.error);
            }

            callback(res);
        });
    } else {
        if (arguments.async) {
            delete arguments.async;

            upAll(arguments, function (res) {
                if (res.code != 0) {
                    console.log(res.error);
                }

                callback(res);
            });
        } else {
            upAllSync(arguments, function (res) {
                if (res.code != 0) {
                    console.log(res.error);
                }

                callback(res);
            });
        }
    }
};

function up(name, opts, callback) {
    var options = merge({}, opts);

    var arguments = [];

    arguments.push('-f');
    arguments.push(docker.getDockerComposeYML(name));
    arguments.push('-p');
    arguments.push(name);
    arguments.push('up');
    arguments.push('-d');

    docker.spawnDockerComposeProcess(arguments, callback);
}

function upAll(opts, callback) {
    var applications = fs.readdirSync(docker.getApplicationsDirectory()).filter(function (file) {
        return file.substr(-4) == '.yml';
    });

    applications = _.map(applications, function (app) {
        return app.substr(0, app.length - 4);
    });

    async.each(applications, function (name, next) {
        up(name, opts, function (res) {
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

function upAllSync(opts, callback) {
    var applications = fs.readdirSync(docker.getApplicationsDirectory()).filter(function (file) {
        return file.substr(-4) == '.yml';
    });

    applications = _.map(applications, function (app) {
        return app.substr(0, app.length - 4);
    });

    async.eachSeries(applications, function (name, next) {
        up(name, opts, function (res) {
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
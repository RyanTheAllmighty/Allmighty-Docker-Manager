var docker = require('../docker');

var fs = require('fs');
var _ = require('lodash');
var path = require('path');
var async = require('async');
var merge = require('merge');
var sprintf = require("sprintf-js").sprintf;

var args;
var applicationName = null;

// The options for this command, if any, and their defaults
var options = {
    quiet: false,
    async: false
};

module.exports.init = function (arguments, callback) {
    args = arguments;
    options = merge(options, args);

    if (args._ && args._.length > 0) {
        applicationName = arguments._.shift();

        if (!docker.isApplicationSync(applicationName)) {
            return callback({
                error: 'No application exists called "' + applicationName + '"!'
            });
        }
    }


    docker.getRunningContainerNames(function (err, containers) {
        if (err) {
            return callback({
                error: err
            });
        }

        if (containers.length == 0) {
            return callback({
                error: 'There are no containers currently running!'
            });
        }

        if (applicationName != null) {
            var isUp = _.some(containers, function (container) {
                return container == applicationName || container.startsWith(applicationName + "_");
            });

            if (!isUp) {
                return callback({
                    error: 'There are no running containers for the application "' + name + '"!'
                });
            }
        }

        callback();
    });
};

module.exports.run = function (callback) {
    if (applicationName != null) {
        down(applicationName, callback);
    } else {
        if (options.async) {
            downAll(callback);
        } else {
            downAllSync(callback);
        }
    }
};

function down(name, callback) {
    var arguments = [];

    arguments.push('-f');
    arguments.push(docker.getDockerComposeYML(name));
    arguments.push('-p');
    arguments.push(name);
    arguments.push('stop');

    docker.spawnDockerComposeProcess(options, arguments, callback);
}

function _asyncEachCallback(name, next) {
    down(name, function (res) {
        if (res && res.error) {
            return next(res);
        }

        next()
    });
}

function downAll(opts, callback) {
    async.each(docker.getApplicationNamesSync(), _asyncEachCallback, callback);
}

function downAllSync(opts, callback) {
    async.eachSeries(docker.getApplicationNamesSync(), _asyncEachCallback, callback);
}
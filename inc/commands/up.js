"use strict";

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

module.exports.init = function (passedArgs, callback) {
    args = passedArgs;
    options = merge(options, args);

    if (args._ && args._.length > 0) {
        applicationName = args._.shift();

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
        up(applicationName, callback);
    } else {
        if (options.async) {
            upAll(callback);
        } else {
            upAllSync(callback);
        }
    }
};

function up(name, callback) {
    var dockerArgs = [];

    dockerArgs.push('-f');
    dockerArgs.push(docker.getDockerComposeYML(name));
    dockerArgs.push('-p');
    dockerArgs.push(name);
    dockerArgs.push('up');
    dockerArgs.push('-d');

    docker.spawnDockerComposeProcess(options, dockerArgs, callback);
}

function _asyncEachCallback(name, next) {
    up(name, function (res) {
        if (res && res.error) {
            return next(res);
        }

        next()
    });
}

function upAll(opts, callback) {
    async.each(docker.getApplicationNamesSync(), _asyncEachCallback, callback);
}

function upAllSync(opts, callback) {
    async.eachSeries(docker.getApplicationNamesSync(), _asyncEachCallback, callback);
}
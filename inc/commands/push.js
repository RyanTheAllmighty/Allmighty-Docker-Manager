"use strict";

var docker = require('../docker');

var fs = require('fs');
var _ = require('lodash');
var path = require('path');
var async = require('async');
var merge = require('merge');
var spawn = require('child_process').spawn;
var sprintf = require("sprintf-js").sprintf;

var args;
var componentName = null;

// The options for this command, if any, and their defaults
var options = {
    quiet: false,
    async: false
};

module.exports.init = function (passedArgs, callback) {
    args = passedArgs;
    options = merge(options, args);

    if (args._ && args._.length > 0) {
        componentName = args._.shift();

        if (!docker.isComponentSync(componentName)) {
            return callback({
                error: 'No component exists called "' + componentName + '"!'
            });
        }
    }

    callback();
};

module.exports.run = function (callback) {
    if (componentName != null) {
        push(componentName, callback);
    } else {
        if (options.async) {
            pushAll(callback);
        } else {
            pushAllSync(callback);
        }
    }
};

function push(name, callback) {
    docker.isBuildable(name, function (buildable) {
        if (!buildable) {
            return callback({
                error: 'Cannot push component ' + name + '!'
            });
        }

        var dockerArgs = [];

        dockerArgs.push('push');
        dockerArgs.push(sprintf('%s/%s', docker.settings.repositoryURL, name));

        docker.spawnDockerProcess(options, dockerArgs, callback);
    });
}

function _asyncEachCallback(name, next) {
    push(name, function (res) {
        if (res && res.error) {
            return next(res);
        }

        next()
    });
}

function pushAll(callback) {
    async.each(docker.getComponentNamesSync(), _asyncEachCallback, callback);
}

function pushAllSync(callback) {
    async.eachSeries(docker.getComponentNamesSync(), _asyncEachCallback, callback);
}
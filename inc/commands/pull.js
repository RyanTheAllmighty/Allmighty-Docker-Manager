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

module.exports.init = function (arguments, callback) {
    args = arguments;
    options = merge(options, args);

    if (args._ && args._.length > 0) {
        componentName = arguments._.shift();

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
        pull(componentName, callback);
    } else {
        if (options.async) {
            pullAll(callback);
        } else {
            pullAllSync(callback);
        }
    }
};

function pull(name, callback) {
    docker.isBuildable(name, function (buildable) {
        if (!buildable) {
            return callback({
                error: 'Cannot pull component ' + name + '!'
            });
        }

        var arguments = [];

        arguments.push('pull');
        arguments.push(sprintf('%s/%s', docker.settings.repositoryURL, name));

        docker.spawnDockerProcess(options, arguments, callback);
    });
}

function _asyncEachCallback(name, next) {
    pull(name, function (res) {
        if (res && res.error) {
            return next(res);
        }

        next()
    });
}

function pullAll(callback) {
    async.each(docker.getComponentNamesSync(), _asyncEachCallback, callback);
}

function pullAllSync(callback) {
    async.eachSeries(docker.getComponentNamesSync(), _asyncEachCallback, callback);
}
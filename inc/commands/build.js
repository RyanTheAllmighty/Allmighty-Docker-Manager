var docker = require('../docker');

var fs = require('fs');
var _ = require('lodash');
var path = require('path');
var async = require('async');
var merge = require('merge');
var sprintf = require("sprintf-js").sprintf;

var args;
var componentName = null;

// The options for this command, if any, and their defaults
var options = {
    quiet: false,
    noCache: false
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
        build(componentName, callback);
    } else {
        if (args.async) {
            buildAll(callback);
        } else {
            buildAllSync(callback);
        }
    }
};

function build(name, callback) {
    docker.isBuildable(name, function (buildable) {
        if (!buildable) {
            return callback({
                error: 'Cannot build ' + name + ' as there is no Dockerfile!'
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

        docker.spawnDockerProcess(options, arguments, callback);
    });
}

function _asyncEachCallback(name, next) {
    build(name, function (res) {
        if (res && res.error) {
            return next(res);
        }

        next()
    });
}

function buildAll(callback) {
    async.each(docker.getComponentNamesSync(), _asyncEachCallback, callback);
}

function buildAllSync(callback) {
    async.eachSeries(docker.getComponentNamesSync(), _asyncEachCallback, callback);
}
var docker = require('../docker');

var fs = require('fs');
var _ = require('lodash');
var path = require('path');
var async = require('async');
var merge = require('merge');
var sprintf = require("sprintf-js").sprintf;

var args;

var actionName;

// The options for this command, if any, and their defaults
var options = {
    quiet: false,
    port: 8080
};

module.exports.init = function (arguments, callback) {
    args = arguments;
    options = merge(options, args);

    if (!args._ || args._.length == 0) {
        return callback({
            error: 'No arguments were passed to this command!'
        });
    }

    actionName = args._.shift().toLowerCase();

    switch (actionName) {
        case 'start':
            docker.isRunning('cadvisor', function (running) {
                if (running) {
                    return callback({
                        code: 1,
                        error: 'The monitoring has already been started!'
                    });
                }

                callback();
            });
            break;
        case 'stop':
            docker.isRunning('cadvisor', function (running) {
                if (!running) {
                    return callback({
                        code: 1,
                        error: 'The monitoring hasn\'t been started!'
                    });
                }

                callback();
            });
            break;
        default:
            return callback({
                error: 'Invalid action "' + actionName + '"!'
            });
    }
};

module.exports.run = function (callback) {
    switch (actionName) {
        case 'start':
            startMonitoring(callback);
            break;
        case 'stop':
            stopMonitoring(callback);
            break;
    }
};

function stopMonitoring(callback) {
    async.series([
        function (cb) {
            docker.spawnDockerProcess(options, ['stop', 'cadvisor'], cb);
        },
        function (cb) {
            docker.spawnDockerProcess(options, ['rm', 'cadvisor'], cb);
        }
    ], callback);
}

function startMonitoring(callback) {
    console.log('Starting monitoring on port ' + options.port);

    var arguments = [];

    arguments.push('run');
    arguments.push('--volume=/:/rootfs:ro');
    arguments.push('--volume=/var/run:/var/run:rw');
    arguments.push('--volume=/sys:/sys:ro');
    arguments.push('--volume=/var/lib/docker/:/var/lib/docker:ro');
    arguments.push(sprintf('--publish=%d:8080', options.port));
    arguments.push('--detach=true');
    arguments.push('--name=cadvisor');
    arguments.push('google/cadvisor:latest');

    docker.spawnDockerProcess(options, arguments, callback);
}
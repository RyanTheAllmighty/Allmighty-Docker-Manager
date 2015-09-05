var docker = require('../docker');

var fs = require('fs');
var _ = require('lodash');
var path = require('path');
var async = require('async');
var merge = require('merge');
var sprintf = require("sprintf-js").sprintf;

module.exports.run = function (arguments, callback) {
    // Check if we have the correct arguments or not
    if (!arguments._ || arguments._.length == 0) {
        return callback({
            code: 1,
            error: 'No arguments were passed to this command!'
        });
    }

    var action = arguments._.shift();

    var port = arguments._.length >= 1 ? arguments._.shift() : 8080;

    if (action.toLowerCase() == 'stop') {
        docker.isRunning('cadvisor', function (running) {
            if (!running) {
                return callback({
                    code: 1,
                    error: 'The monitoring hasn\'t been started yet!'
                });
            }


            async.series([
                function (cb) {
                    docker.spawnDockerProcess(['stop', 'cadvisor'], function (ret) {
                        if (ret.code != 0) {
                            return cb(new Error(ret.error));
                        }

                        cb();
                    });
                },
                function (cb) {
                    docker.spawnDockerProcess(['rm', 'cadvisor'], function (ret) {
                        if (ret.code != 0) {
                            return cb(new Error(ret.error));
                        }

                        cb();
                    });
                }
            ], function (err) {
                if (err) {
                    callback(err);
                }

                callback({
                    code: 0
                })
            });
        });
    } else if (action.toLowerCase() == 'start') {
        var dArgs = [];

        dArgs.push('run');
        dArgs.push('--volume=/:/rootfs:ro');
        dArgs.push('--volume=/var/run:/var/run:rw');
        dArgs.push('--volume=/sys:/sys:ro');
        dArgs.push('--volume=/var/lib/docker/:/var/lib/docker:ro');
        dArgs.push(sprintf('--publish=%d:8080', port));
        dArgs.push('--detach=true');
        dArgs.push('--name=cadvisor');
        dArgs.push('google/cadvisor:latest');

        docker.spawnDockerProcess(dArgs, callback);
    } else {
        callback({
            code: 1,
            error: 'The second argument to monitor must be start or stop!'
        });
    }
};
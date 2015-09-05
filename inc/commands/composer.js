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

    var name = arguments._.shift();
    var args = arguments;

    if (!docker.isApplicationSync(name)) {
        return callback({
            code: 1,
            error: 'No application exists called "' + name + '"!'
        });
    }

    // Check if the containers we need to be up are actually up
    docker.isRunning(sprintf('%s_data', name), function (running, offline) {
        if (!running) {
            return callback({
                code: 1,
                error: 'Couldn\'t start the artisan container as the following container/s aren\'t online: ' + offline
            });
        }

        composer(name, args, function (res) {
            if (res.code != 0) {
                console.log(res.error);
            }

            callback(res);
        });
    });
};

function composer(name, opts, callback) {
    var options = merge({}, opts);

    var arguments = [];

    arguments.push('run');
    arguments.push('--volumes-from');
    arguments.push(sprintf('%s_data', name));
    arguments.push('--name');
    arguments.push(sprintf('%s_composer', name));
    arguments.push('--rm');
    arguments.push('-w="/mnt/site/"');
    arguments.push('-v');
    arguments.push('/docker/data/composer:/root/.composer/cache');
    arguments.push(sprintf('%s/php', docker.settings.repositoryURL));

    arguments.push('composer');
    arguments.push('--ansi');

    arguments = arguments.concat(opts._raw.slice(opts._raw.indexOf(name) + 1));

    docker.spawnDockerProcess(arguments, callback);
}
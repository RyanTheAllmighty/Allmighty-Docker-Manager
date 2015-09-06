var docker = require('../docker');

var fs = require('fs');
var _ = require('lodash');
var path = require('path');
var async = require('async');
var merge = require('merge');
var sprintf = require("sprintf-js").sprintf;

var args;
var applicationName;

// The options for this command, if any, and their defaults
var options = {
    quiet: false
};

// An array of container names needing to be online for this container to work. Not set here, it's pushed to in init()
var containersNeedingToBeOnline = [];

// An array of application names this shouldn't be run with
var dontRunOnApplications = ['nginx'];

module.exports.init = function (arguments, callback) {
    args = arguments;
    options = merge(options, args);

    // Check if we have the correct arguments or not
    if (!args._ || args._.length == 0) {
        return callback({
            error: 'No arguments were passed to this command!'
        });
    }

    // Now we get the application name we're targeting
    applicationName = args._.shift();

    // And check it's valid
    if (!docker.isApplicationSync(applicationName)) {
        return callback({
            error: 'No application exists called "' + applicationName + '"!'
        });
    }

    if (_.contains(dontRunOnApplications, applicationName)) {
        return callback({
            error: 'Artisan cannot be run on application "' + applicationName + '"!'
        });
    }

    // Setup the array of containers we need to be online to run this
    containersNeedingToBeOnline.push(sprintf('%s_data', applicationName));

    // Check if the containers we need to be up are actually up
    docker.isRunning(containersNeedingToBeOnline, function (running, offline) {
        if (!running) {
            return callback({
                error: 'Couldn\'t start the artisan container as the following container/s aren\'t online: ' + offline
            });
        }

        callback();
    });
};

module.exports.run = function (callback) {
    var arguments = [];

    arguments.push('run');
    arguments.push('--volumes-from');
    arguments.push(sprintf('%s_data', applicationName));
    arguments.push('--name');
    arguments.push(sprintf('%s_artisan', applicationName));
    arguments.push('--rm');
    arguments.push('-w="/mnt/site/"');
    arguments.push(sprintf('%s/php', docker.settings.repositoryURL));

    arguments.push('php');
    arguments.push('artisan');
    arguments.push('--ansi');

    arguments = arguments.concat(args._raw.slice(args._raw.indexOf(applicationName) + 1));

    docker.spawnDockerProcess(options, arguments, callback);
};
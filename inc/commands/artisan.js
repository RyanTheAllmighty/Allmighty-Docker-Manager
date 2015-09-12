"use strict";

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

module.exports.init = function (passedArgs, callback) {
    args = passedArgs;
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
    var dockerArgs = [];

    dockerArgs.push('run');
    dockerArgs.push('--volumes-from');
    dockerArgs.push(sprintf('%s_data', applicationName));
    dockerArgs.push('--name');
    dockerArgs.push(sprintf('%s_artisan', applicationName));
    dockerArgs.push('--rm');
    dockerArgs.push('-w="/mnt/site/"');
    dockerArgs.push(sprintf('%s/php', docker.settings.repositoryURL));

    dockerArgs.push('php');
    dockerArgs.push('artisan');
    dockerArgs.push('--ansi');

    // Add in the arguments for artisan minus the quiet flag if there
    dockerArgs = dockerArgs.concat(_.remove(args._raw.slice(args._raw.indexOf(name) + 1), function (n) {
        return n == '--quiet';
    }));

    docker.spawnDockerProcess(options, dockerArgs, callback);
};
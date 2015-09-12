"use strict";

var docker = require('../docker');

var fs = require('fs');
var _ = require('lodash');
var path = require('path');
var merge = require('merge');

var args;

// The options for this command, if any, and their defaults
var options = {
    quiet: false
};

module.exports.init = function (passedArgs, callback) {
    args = passedArgs;
    options = merge(options, args);

    callback();
};

module.exports.run = function (callback) {
    setupDirectories();

    callback();
};

function setupDirectories() {
    if (!options.quiet) {
        console.log('Setting up the directories needed!');
    }

    _.forEach(docker.getApplicationsSync(), function (application) {
        application.setupDirectories(options);
    });
}
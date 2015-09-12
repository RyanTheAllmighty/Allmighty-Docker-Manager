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
var options = {};

module.exports.init = function (passedArgs, callback) {
    args = passedArgs;
    options = merge(options, args);

    if (!args._ || args._.length == 0) {
        return callback({
            error: 'No arguments were passed to this command!'
        });
    }

    applicationName = args._.shift();

    if (!docker.isApplicationSync(applicationName)) {
        return callback({
            error: 'No application exists called "' + applicationName + '"!'
        });
    }

    callback();
};

module.exports.run = function (callback) {
    var application = docker.getApplicationSync(applicationName);

    console.log(application.getName());

    callback();
};
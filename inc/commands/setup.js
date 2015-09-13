/**
 * The setup command sets up the directories and files for the applications and components as necessary.
 *
 * This is meant to be run on first setup or when a new component/application is added so that it's correct folders can
 * be created and setup.
 */
"use strict";

var brain = require('../brain');

var fs = require('fs');
var _ = require('lodash');
var path = require('path');
var merge = require('merge');

/**
 * The options for this command along with their defaults.
 *
 * quiet: If there should be no output from the command (default: false)
 *
 * @type {{quiet: boolean}}
 */
var options = {
    quiet: false
};

/**
 * Initializes this command with the given arguments and does some error checking to make sure we can actually run.
 *
 * @param {Object} passedArgs - An object of arguments
 * @param {App~commandRunCallback} callback - The callback for when we're done
 */
module.exports.init = function (passedArgs, callback) {
    options = merge(options, passedArgs);

    callback();
};

/**
 * This runs the command with the given arguments/options set in the init method and returns possibly an error and
 * response in the callback if any.
 *
 * @param {App~commandRunCallback} callback - The callback for when we're done
 */
module.exports.run = function (callback) {
    if (!options.quiet) {
        console.log('Setting up the directories needed!');
    }


    _.forEach(brain.getApplications(), function (application) {
        application.setupDirectories(options);
    });

    callback();
};
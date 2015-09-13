/**
 * The restart command will restart one or all applications.
 *
 * When no application name is provided after the command name, it will restart all applications.
 */
"use strict";

var brain = require('../brain');

var _ = require('lodash');
var async = require('async');
var merge = require('merge');

/**
 * The applications we wish to restart.
 *
 * @type {Application[]}
 */
var toActUpon = [];

/**
 * The options for this command along with their defaults.
 *
 * quiet: If there should be no output from the command (default: false)
 * async: If we should run all the builds we're doing asynchronously (default: false)
 *
 * @type {{quiet: boolean, async: boolean}}
 */
var options = {
    quiet: false,
    async: false
};

/**
 * Initializes this command with the given arguments and does some error checking to make sure we can actually run.
 *
 * @param {Object} passedArgs - An object of arguments
 * @param {App~commandRunCallback} callback - The callback for when we're done
 */
module.exports.init = function (passedArgs, callback) {
    options = merge(options, passedArgs);

    if (passedArgs._ && passedArgs._.length > 0) {
        let applicationName = passedArgs._[0];

        if (!brain.isComponent(applicationName)) {
            return callback({
                error: 'No application exists called "' + applicationName + '"!'
            });
        }

        toActUpon.push(brain.getApplication(applicationName));
    } else {
        toActUpon = toActUpon.concat(brain.getApplicationsAsArray());
    }

    brain.getRunningContainerNames(function (err, containers) {
        if (err) {
            return callback(err);
        }

        if (containers.length == 0) {
            return callback(new Error('There are no containers currently running!'));
        }

        _.forEach(toActUpon, function (application) {
            var isUp = _.some(containers, function (container) {
                return container == application.name || container.startsWith(application.name + "_");
            });

            if (!isUp) {
                toActUpon.splice(toActUpon.indexOf(application), 1);
            }
        });

        if (toActUpon.length == 0) {
            return callback(new Error('There are no containers currently running for any applications!'));
        }

        callback();
    });
};

/**
 * This runs the command with the given arguments/options set in the init method and returns possibly an error and
 * response in the callback if any.
 *
 * TODO: Switch this to use the JSON specifications rather than the YML with Docker Compose
 *
 * @param {App~commandRunCallback} callback - The callback for when we're done
 */
module.exports.run = function (callback) {
    let _asyncEachCallback = function (application, next) {
        application.restart(options, next);
    };

    if (options.async) {
        async.each(toActUpon, _asyncEachCallback, callback);
    } else {
        async.eachSeries(toActUpon, _asyncEachCallback, callback);
    }
};
/*
 * Allmighty Docker Manager - https://github.com/RyanTheAllmighty/Allmighty-Docker-Manager
 * Copyright (C) 2015 RyanTheAllmighty
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

/**
 * The down command will bring one or all of the applications down and stop them.
 *
 * When no application name is provided after the command name, it will stop all applications.
 */
"use strict";

var brain = require('../brain');

var _ = require('lodash');
var async = require('async');
var merge = require('merge');

/**
 * The applications we wish to bring down.
 *
 * @type {Application[]}
 */
var toActUpon = [];

/**
 * The options for this command along with their defaults.
 *
 * quiet: If there should be no output from the command (default: false)
 * async: If we should run all the builds we're doing asynchronously (default: false)
 * rm: If the container should be removed after being taken down (default: false)
 *
 * @type {{quiet: boolean, async: boolean, rm: boolean}}
 */
var options = {
    quiet: false,
    async: false,
    rm: false
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

        if (!brain.isApplicationSync(applicationName)) {
            return callback({
                error: 'No application exists called "' + applicationName + '"!'
            });
        }

        toActUpon.push(brain.getApplication(applicationName));
    } else {
        toActUpon = brain.getApplicationsAsArray();
    }


    // Go through and check each application and remove the ones that are already online.
    async.each(toActUpon, function (application, next) {
        application.isAnyUp(function (up) {
            if (!up) {
                toActUpon.splice(toActUpon.indexOf(application), 1);
            }

            next();
        });
    }, function (err) {
        if (err) {
            return callback(err);
        }

        // If all the applications we want to start are already offline, then we don't need to do anything.
        if (toActUpon.length === 0) {
            return callback(new Error('All the necessary containers are already down!'));
        }

        callback();
    });
};

/**
 * This runs the command with the given arguments/options set in the init method and returns possibly an error and
 * response in the callback if any.
 *
 * @param {App~commandRunCallback} callback - The callback for when we're done
 */
module.exports.run = function (callback) {
    let _asyncEachCallback = function (application, next) {
        application.down(options, next);
    };

    if (options.async) {
        async.each(toActUpon, _asyncEachCallback, callback);
    } else {
        async.eachSeries(toActUpon, _asyncEachCallback, callback);
    }
};
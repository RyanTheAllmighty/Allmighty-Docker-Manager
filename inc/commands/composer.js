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
 * The composer command will run the composer command on a container.
 *
 * Any arguments passed after the applications name to run on will be passed to the container to run on composer.
 */
"use strict";

var brain = require('../brain');

var _ = require('lodash');
var async = require('async');
var merge = require('merge');

/**
 * The Application we want to run Composer in.
 *
 * @type Application|null
 */
var theApplication = null;

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

    // Now we get the application name we're targeting
    let applicationName = passedArgs._[0];

    // And check it's valid
    if (!brain.isApplicationSync(applicationName)) {
        return callback(new Error('No application exists called "' + applicationName + '"!'));
    }

    theApplication = brain.getApplication(applicationName);

    if (!theApplication.runsComposer) {
        return callback(new Error('Composer cannot be run on this application!'));
    }

    callback();
};

/**
 * This runs the command with the given arguments/options set in the init method and returns possibly an error and
 * response in the callback if any.
 *
 * @param {App~commandRunCallback} callback - The callback for when we're done
 */
module.exports.run = function (callback) {
    theApplication.runComposer(options, callback);
};
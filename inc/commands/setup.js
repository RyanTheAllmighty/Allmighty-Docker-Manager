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
 * The setup command sets up the directories and files for the applications and components as necessary.
 *
 * This is meant to be run on first setup or when a new component/application is added so that it's correct folders can
 * be created and setup.
 */

(function () {
    'use strict';

    let brain = require('../brain');

    let _ = require('lodash');
    let merge = require('merge');

    /**
     * The options for this command along with their defaults.
     *
     * quiet: If there should be no output from the command (default: false)
     *
     * @type {{quiet: boolean}}
     */
    let options = {
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
            brain.logger.info('Setting up the directories needed!');
        }

        _.forEach(brain.getApplications(), function (application) {
            application.setupDirectories(options);
        });

        callback();
    };
})();
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

    let fs = require('fs');
    let _ = require('lodash');
    let merge = require('merge');
    let mkdirp = require('mkdirp');

    /**
     * The options for this command along with their defaults.
     *
     * quiet: If there should be no output from the command (default: false)
     *
     * @type {{quiet: boolean}}
     */
    module.exports.options = {
        quiet: false
    };

    /**
     * Initializes this command with the given arguments and does some error checking to make sure we can actually run.
     *
     * @param {Object} passedArgs - An object of arguments
     * @returns {Promise}
     */
    module.exports.init = function (passedArgs) {
        return new Promise(function (resolve) {
            module.exports.options = merge(module.exports.options, passedArgs);

            resolve();
        });
    };

    /**
     * This runs the command with the given arguments/options set in the init method and returns a promise which will be rejected with an error or resolved.
     *
     * @returns {Promise}
     */
    module.exports.run = function () {
        return new Promise(function (resolve) {
            if (!module.exports.options.quiet) {
                brain.logger.info('Setting up the directories needed!');
            }

            _.forEach(brain.directories, function (directory) {
                if (!fs.existsSync(directory.path)) {
                    if (!module.exports.options.quiet) {
                        brain.logger.info('Creating directory ' + directory.path);
                    }

                    mkdirp.sync(directory.path);
                }
            });

            _.forEach(brain.getApplications(), function (application) {
                application.setupDirectories(module.exports.options);
            });

            resolve();
        });
    };
})();
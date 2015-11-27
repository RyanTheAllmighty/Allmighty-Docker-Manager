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
 * The status command gets the status of all layers for all applications and checks if they are online or not.
 */

(function () {
    'use strict';

    let brain = require('../brain');

    let async = require('async');
    let sprintf = require('sprintf-js').sprintf;

    /**
     * The applications we wish to check the status of.
     *
     * @type {Application[]}
     */
    let toActUpon = [];

    /**
     * Initializes this command with the given arguments and does some error checking to make sure we can actually run.
     *
     * @param {Object} passedArgs - An object of arguments
     * @param {App~commandRunCallback} callback - The callback for when we're done
     */
    module.exports.init = function (passedArgs, callback) {
        if (passedArgs._ && passedArgs._.length > 0) {
            for (let i = 0; i < passedArgs._.length; i++) {
                let applicationName = passedArgs._[i];

                if (!brain.isApplicationSync(applicationName)) {
                    return callback(new Error('No application exists called "' + applicationName + '"!'));
                }

                toActUpon.push(brain.getApplication(applicationName));
            }
        } else {
            toActUpon = brain.getApplicationsAsArray();
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
        let first = true;

        async.eachSeries(toActUpon, function (application, next) {
            if (first) {
                first = false;
            } else {
                brain.logger.line();
            }

            brain.logger.raw(application.applicationName.cyan);
            brain.logger.line();

            async.eachSeries(application.getLayersAsArray(), function (layer, nextt) {
                if (!layer.dataOnly && !layer.runOnly) {
                    brain.logger.raw(sprintf('%15s: ', layer.name));
                    layer.isUp(function (isUp) {
                        brain.logger.raw(isUp ? 'Online'.green : 'Offline'.red);
                        brain.logger.line();

                        nextt();
                    });
                } else {
                    nextt();
                }
            }, function () {
                next();
            });
        }, callback);

    };
})();
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

    let _ = require('lodash');
    let async = require('async');
    let merge = require('merge');

    /**
     * The applications we wish to check the status of.
     *
     * @type {Application[]}
     */
    let toActUpon = [];

    /**
     * The options for this command along with their defaults.
     *
     * up: If we should only show up layers (default: false)
     *
     * @type {{up: boolean}}
     */
    module.exports.options = {
        up: false
    };

    /**
     * Initializes this command with the given arguments and does some error checking to make sure we can actually run.
     *
     * @param {Object} passedArgs - An object of arguments
     * @returns {Promise}
     */
    module.exports.init = function (passedArgs) {
        return new Promise(function (resolve, reject) {
            module.exports.options = merge(module.exports.options, passedArgs);

            if (passedArgs._ && passedArgs._.length > 0) {
                for (let i = 0; i < passedArgs._.length; i++) {
                    let applicationName = passedArgs._[i];

                    if (!brain.isApplicationSync(applicationName)) {
                        return reject(new Error('No application exists called "' + applicationName + '"!'));
                    }

                    if (applicationName.indexOf('*') === -1) {
                        toActUpon.push(brain.getApplication(applicationName));
                    } else {
                        toActUpon = toActUpon.concat(brain.getApplications(applicationName));
                    }
                }
            } else {
                toActUpon = brain.getApplicationsAsArray();
            }

            toActUpon = _.uniq(toActUpon);

            resolve();
        });
    };

    /**
     * This runs the command with the given arguments/options set in the init method and returns a promise which will be rejected with an error or resolved.
     *
     * @returns {Promise}
     */
    module.exports.run = function () {
        return new Promise(function (resolve, reject) {
            async.eachSeries(toActUpon, function (application, next) {
                application.logStatus(module.exports.options).then(() => next()).catch(next);
            }, (err) => err ? reject(err) : resolve());
        });
    };
})();
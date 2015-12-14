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
 * The cron command will run all the crons necessary for the passed in applications.
 *
 * When no application name is provided after the command name, it will start all applications.
 */

(function () {
    'use strict';

    let brain = require('../brain');

    let _ = require('lodash');
    let async = require('async');
    let merge = require('merge');

    /**
     * The applications we wish to bring up.
     *
     * @type {Application[]}
     */
    let toActUpon = [];

    /**
     * The options for this command along with their defaults.
     *
     * quiet: If there should be no output from the command (default: false)
     * async: If we should run all the builds we're doing asynchronously (default: false)
     *
     * @type {{quiet: boolean, async: boolean}}
     */
    module.exports.options = {
        quiet: false,
        async: false
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

            // Go through and check each application and remove the ones that aren't all online.
            async.each(toActUpon, function (application, next) {
                // If there are no crons, then remove it from the list of things to do
                if (application.crons.length === 0) {
                    toActUpon.splice(toActUpon.indexOf(application), 1);
                    return next();
                }

                // If none of them are due to be run we can remove it also
                if (!_.any(application.crons, 'shouldExecute', true)) {
                    toActUpon.splice(toActUpon.indexOf(application), 1);
                    return next();
                }

                // Else we need to check the application is up first
                application.isAllUp().then(function (up) {
                    if (!up) {
                        toActUpon.splice(toActUpon.indexOf(application), 1);
                    }

                    next();
                });
            }, function (err) {
                if (err) {
                    return reject(err);
                }

                // If all the applications we want to run the crons for aren't online, then we don't need to do anything.
                if (toActUpon.length === 0) {
                    return reject(new Error('There are no crons to be run!'));
                }

                resolve();
            });
        });
    };

    /**
     * This runs the command with the given arguments/options set in the init method and returns a promise which will be rejected with an error or resolved.
     *
     * @returns {Promise}
     */
    module.exports.run = function () {
        return new Promise(function (resolve, reject) {
            let _asyncEachCallback = function (application, next) {
                application.executeCron(module.exports.options).then(() => next()).catch(next);
            };

            if (module.exports.options.async) {
                async.each(toActUpon, _asyncEachCallback, (err) => err ? reject(err) : resolve());
            } else {
                async.eachSeries(toActUpon, _asyncEachCallback, (err) => err ? reject(err) : resolve());
            }
        });
    };
})();
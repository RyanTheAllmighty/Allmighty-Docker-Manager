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
 * The list command will list all of the layer names for one or more applications. This is useful for passing into the docker stats command.
 *
 * When no application name is provided after the command name, it will list all applications layers.
 */

(function () {
    'use strict';

    let brain = require('../brain');

    let _ = require('lodash');
    let async = require('async');

    /**
     * The applications we wish to list.
     *
     * @type {Application[]}
     */
    let toList = [];

    /**
     * Initializes this command with the given arguments and does some error checking to make sure we can actually run.
     *
     * @param {Object} passedArgs - An object of arguments
     * @returns {Promise}
     */
    module.exports.init = function (passedArgs) {
        return new Promise(function (resolve, reject) {
            if (passedArgs._ && passedArgs._.length > 0) {
                for (let i = 0; i < passedArgs._.length; i++) {
                    let applicationName = passedArgs._[i];

                    if (!brain.isApplicationSync(applicationName)) {
                        return reject(new Error('No application exists called "' + applicationName + '"!'));
                    }

                    if (applicationName.indexOf('*') === -1) {
                        toList.push(brain.getApplication(applicationName));
                    } else {
                        toList = toList.concat(brain.getApplications(applicationName));
                    }
                }
            } else {
                toList = brain.getApplicationsAsArray();
            }

            toList = _.uniq(toList);

            // Go through and check each application and remove the ones that are not online.
            async.each(toList, function (application, next) {
                application.isAnyUp().then(function (up) {
                    if (!up) {
                        toList.splice(toList.indexOf(application), 1);
                    }

                    next();
                }).catch(next);
            }, function (err) {
                if (err) {
                    return reject(err);
                }

                // If all the applications we want to list are offline, then we don't need to do anything.
                if (toList.length === 0) {
                    return reject(new Error('None of the provided applications are online!'));
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
            let list = [];

            async.each(toList, function (application, next) {
                async.each(application.layers, function (layer, next1) {
                    layer.isUp().then(function (isUp) {
                        if (isUp) {
                            list.push(layer.containerName);
                        }

                        next1();
                    }).catch(next);
                }, next);
            }, function (err) {
                if (err) {
                    return reject(err);
                }

                brain.logger.info(list.join(' '));

                resolve();
            });
        });
    };
})();
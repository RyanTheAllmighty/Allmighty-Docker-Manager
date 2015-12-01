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
 * The push command will push built images to the registry defined in the settings.json file.
 */

(function () {
    'use strict';

    let brain = require('../brain');

    let async = require('async');
    let merge = require('merge');

    /**
     * The Component/s we want to push.
     *
     * @type {Component[]}
     */
    let toPush = [];

    /**
     * The options for this command along with their defaults.
     *
     * quiet: If there should be no output from the command (default: false)
     * async: If we should push all the components asynchronously (default: false)
     *
     * @type {{quiet: boolean, async: boolean}}
     */
    let options = {
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
            options = merge(options, passedArgs);

            if (passedArgs._ && passedArgs._.length > 0) {
                for (let i = 0; i < passedArgs._.length; i++) {
                    let componentName = passedArgs._[i];

                    if (!brain.isComponent(componentName)) {
                        return reject(new Error('No component exists called "' + componentName + '"!'));
                    }

                    toPush.push(brain.getComponent(componentName));
                }
            } else {
                toPush = toPush.concat(brain.getComponentsAsArray());
            }

            async.each(toPush, function (component, next) {
                brain.docker.getImage(component.tagName).inspect(function (err) {
                    if (err) {
                        toPush.splice(toPush.indexOf(component), 1);
                    }

                    next();
                });
            }, (err) => err ? reject(err) : resolve());
        });
    };

    /**
     * This runs the command with the given arguments/options set in the init method and returns a promise which will be rejected with an error or resolved.
     *
     * @returns {Promise}
     */
    module.exports.run = function () {
        return new Promise(function (resolve, reject) {
            let _asyncEachCallback = function (component, next) {
                component.push(options, next);
            };

            if (options.async) {
                async.each(toPush, _asyncEachCallback, (err) => err ? reject(err) : resolve());
            } else {
                async.eachSeries(toPush, _asyncEachCallback, (err) => err ? reject(err) : resolve());
            }
        });
    };
})();
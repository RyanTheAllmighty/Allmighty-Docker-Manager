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
 * The build command will build one or all components for the system.
 *
 * When no arguments are passed in to this command it will build all the components in the system. Alternatively you can
 * pass a name into the command which is the name of the component to build.
 */

(function () {
    'use strict';

    let brain = require('../brain');

    let _ = require('lodash');
    let async = require('async');
    let merge = require('merge');

    /**
     * The Components we want to build.
     *
     * @type {Component[]}
     */
    let toBuild = [];

    /**
     * The options for this command along with their defaults.
     *
     * quiet: If there should be no output from the command (default: false)
     * noCache: If we should bypass the build cache when building (default: false)
     * async: If we should run all the builds we're doing asynchronously (default: false)
     * version: The version of this build to tag it with and also passed into the Docker build process [ARG VERSION] (default: null)
     * versions: If we should list all the available versions of this component we can build (default: false)
     * n: The number of versions we should show when using the versions option (default: null)
     * tags: The tags we should give this build (default: [])
     *
     * @type {{quiet: boolean, noCache: boolean, async: boolean, async: String|null, version: String|null, versions: boolean, n: Number|null, tags: String[]}}
     */
    module.exports.options = {
        quiet: false,
        noCache: false,
        async: false,
        version: null,
        versions: false,
        n: null,
        tags: []
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

            if (module.exports.options.tag) {
                if (module.exports.options.tag instanceof Array) {
                    module.exports.options.tags = module.exports.options.tag;
                } else {
                    module.exports.options.tags.push(module.exports.options.tag + '');
                }

                delete module.exports.options.tag;
            }

            if (module.exports.options.n) {
                module.exports.options.n = isNaN(module.exports.options.n) ? null : parseInt(module.exports.options.n);
            }

            if (passedArgs._ && passedArgs._.length > 0) {
                for (let i = 0; i < passedArgs._.length; i++) {
                    let componentName = passedArgs._[i];

                    if (!brain.isComponent(componentName)) {
                        return reject(new Error(`No component exists called "${componentName}"!`));
                    }

                    toBuild.push(brain.getComponent(componentName));
                }
            } else {
                toBuild = toBuild.concat(brain.getComponentsAsArray());
            }

            toBuild = _.uniq(toBuild);

            if (toBuild.length !== 1 && module.exports.options.version !== null) {
                module.exports.options.version = null;
                module.exports.options.versions = false;
            }

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
            let _asyncEachCallback = function (component, next) {
                component.build(module.exports.options).then(() => next()).catch(next);
            };

            if (module.exports.options.async) {
                async.each(toBuild, _asyncEachCallback, (err) => err ? reject(err) : resolve());
            } else {
                async.eachSeries(toBuild, _asyncEachCallback, (err) => err ? reject(err) : resolve());
            }
        });
    };
})();
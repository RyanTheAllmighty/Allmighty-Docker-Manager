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

    let fs = require('fs');
    let _ = require('lodash');
    let path = require('path');
    let tabtab = require('tabtab');

    let commandLineArgs = [];

    /**
     * Initializes this command with the given arguments and does some error checking to make sure we can actually run.
     *
     * @param {Object} passedArgs - An object of arguments
     * @returns {Promise}
     */
    module.exports.init = function (passedArgs) {
        if (passedArgs._) {
            commandLineArgs = passedArgs._;
        }

        return new Promise(function (resolve) {
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
            tabtab.complete('adm', function (err, data) {
                if (err || !data) {
                    return resolve();
                }

                if (!data.prev || data.prev === 'adm') {
                    let commandNames = fs.readdirSync(__dirname).filter(function (file) {
                        return fs.statSync(path.join(__dirname, file)).isFile();
                    }, this).map(function (file) {
                        return file.substr(0, file.length - 3);
                    });

                    tabtab.log(commandNames, data);

                    return resolve();
                }

                let re = /adm ([a-z]+)/i;
                let m = re.exec(data.line);

                if (!m) {
                    return resolve();
                }

                let commandName = m[1];
                let command = require(path.join(__dirname, commandName + '.js'));

                if (/^--\w?/.test(data.last)) {
                    if (command.options) {
                        tabtab.log(Object.keys(command.options), data, '--');
                    }
                } else {
                    let dataToShow = [];

                    if (commandName === 'build' || commandName === 'pull' || commandName === 'push') {
                        dataToShow = brain.getComponentsAsArray().map(function (component) {
                            return component.name;
                        });
                    }

                    if (commandName === 'down' || commandName === 'restart' || commandName === 'up') {
                        dataToShow = brain.getApplicationsAsArray().map(function (application) {
                            return application.applicationName;
                        });
                    }

                    if (commandName === 'logs' || commandName === 'run') {
                        re = /adm [a-z]+ ([0-9a-z\-\.]+)/i;
                        m = re.exec(data.line);

                        let valid = false;

                        if (m) {
                            valid = _.some(brain.getApplicationsAsArray(), function (app) {
                                return app.applicationName === m[1];
                            });
                        }

                        if (!valid) {
                            dataToShow = brain.getApplicationsAsArray().map(function (application) {
                                return application.applicationName;
                            });
                        } else {
                            let applicationName = m[1];
                            let application = brain.getApplication(applicationName);

                            re = /adm [a-z]+ [0-9a-z\-\.]+ ([0-9a-z\-\.]+)/i;
                            m = re.exec(data.line);

                            valid = true;

                            if (m) {
                                valid = !_.some(application.layers, function (layer) {
                                    return layer.name === m[1];
                                });
                            }

                            if (valid) {
                                _.each(application.layers, function (layer) {
                                    if (commandName === 'logs' && !layer.runOnly && !layer.dataOnly) {
                                        dataToShow.push(layer.name);
                                    } else if (commandName === 'run' && layer.runOnly) {
                                        dataToShow.push(layer.name);
                                    }
                                });
                            }
                        }
                    }

                    if (dataToShow.length !== 0) {
                        tabtab.log(dataToShow, data);
                    }
                }

                return resolve();
            });
        });
    };
})();
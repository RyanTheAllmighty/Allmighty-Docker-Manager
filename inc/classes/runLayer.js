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

(function () {
    'use strict';

    let brain = require('../brain');

    let Layer = require('./layer');
    let RunAfter = require('./runAfter');

    let _ = require('lodash');
    let async = require('async');

    // Symbol for storing the objects properties
    let objectSymbol = Symbol();

    module.exports = class RunLayer extends Layer {
        /**
         * Constructor to create a new Data layer.
         *
         * @param {Application} application - the application instance this layer belongs to
         * @param {String} name - the name of this layer
         * @param {Object} originalObject - the object passed in which represents this layer. Parsed from json
         */
        constructor(application, name, originalObject) {
            super(application, name, originalObject);

            this[objectSymbol] = {};

            // Turn the runAfters from in the object into RunAfter objects
            this[objectSymbol].runAfter = [];
            if (originalObject.runAfter) {
                _.forEach(originalObject.runAfter, function (runAfter) {
                    this[objectSymbol].runAfter.push(new RunAfter(this, runAfter));
                }, this);
            }
        }

        /**
         * Gets the things to run after this layer is finished (runOnly layers only).
         *
         * @returns {RunAfter[]}
         */
        get runAfter() {
            return this[objectSymbol].runAfter;
        }

        /**
         * Returns if this layer is a run only layer which means it's intended to be run by itself only.
         *
         * @returns {Boolean}
         */
        get runOnly() {
            return true;
        }

        /**
         * See's if this layer can be run or not.
         *
         * @returns {Promise}
         */
        canRun() {
            return new Promise(function (resolve, reject) {
                this.application.areLayersUp(this.dependentLayers).then(function (areUp) {
                    if (!areUp) {
                        return resolve(false);
                    }

                    resolve(true);
                }).catch(reject);
            }.bind(this));
        }

        /**
         * This runs this RunLayer. The stdin is attached and allows interaction with the container.
         *
         * @param {Object|Array} options - options passed in from the user
         * @returns {Promise}
         */
        run(options) {
            let self = this;

            return new Promise(function (resolve, reject) {
                this.container.remove(function () {
                    let dOpts = self.dockerOptions;

                    // Change our specific options for Docker
                    dOpts.Cmd = self.command.concat(options instanceof Array ? options : options._raw.slice(options._raw.indexOf(self.name) + 1));
                    dOpts.AttachStdin = true;
                    dOpts.AttachStdout = true;
                    dOpts.AttachStderr = true;
                    dOpts.Tty = true;
                    dOpts.OpenStdin = true;
                    dOpts.StdinOnce = false;

                    brain.docker.getImage(self.image).inspect(function (err) {
                        if (err) {
                            pullAndUp();
                        } else {
                            checkLayers();
                        }
                    });

                    let layersNeeded = [];

                    function pullAndUp() {
                        self.pull().then(checkLayers).catch(reject);
                    }

                    function checkLayers() {
                        self.canRun().then(function (canRun) {
                            if (canRun) {
                                return runIt();
                            }

                            async.eachSeries(self.dependentLayers, function (layerName, next) {
                                let layer = self.application.getLayer(layerName);

                                if (!layer) {
                                    return next(new Error(`There is no layer called ${layerName} for this application!`));
                                }

                                layer.isUp().then(function (isUp) {
                                    if (!isUp) {
                                        layersNeeded.push(layer);
                                    }

                                    next();
                                }).catch(reject);
                            }, function (err) {
                                if (err) {
                                    return reject(err);
                                }

                                async.eachSeries(layersNeeded, function (layer, next) {
                                    layer.up(options).then(() => next()).catch(next);
                                }, (err) => err ? reject(err) : runIt());
                            });
                        }).catch(reject);
                    }

                    function runIt() {
                        brain.run(dOpts).then(function (err) {
                            if (err) {
                                return reject(err);
                            }

                            async.eachSeries(layersNeeded, function (layer, next) {
                                options.rm = true;
                                layer.down(options).then(() => next()).catch(next);
                            }, function (err) {
                                if (err) {
                                    return reject(err);
                                }

                                if (self.runAfter) {
                                    async.eachSeries(self.runAfter, function (ra, next) {
                                        ra.layer.run(ra.command).then(() => next()).catch(next);
                                    }, (err) => err ? reject(err) : resolve());
                                } else {
                                    resolve();
                                }
                            });
                        }).catch(reject);
                    }
                });
            }.bind(this));
        }
    };
})();
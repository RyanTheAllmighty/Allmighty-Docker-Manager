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

    let Cron = require('./cron');
    let Layer = require('./layer');
    let RunLayer = require('./runLayer');
    let DataLayer = require('./dataLayer');
    let Directory = require('./directory');

    let fs = require('fs');
    let _ = require('lodash');
    let path = require('path');
    let async = require('async');
    let mkdirp = require('mkdirp');
    let moment = require('moment');
    let sprintf = require('sprintf-js').sprintf;

    // Symbol for storing the objects properties
    let objectSymbol = Symbol();

    module.exports = class Application {
        /**
         * Constructor to create a new application.
         *
         * @param {String} name - the internal name of this application
         * @param {Object} originalObject - the object passed in which represents this application. Parsed from json
         */
        constructor(name, originalObject) {
            this[objectSymbol] = {};

            this[objectSymbol].applicationName = name;

            // Copy over the original objects properties to this objects private Symbol
            for (let propName in originalObject) {
                if (originalObject.hasOwnProperty(propName)) {
                    this[objectSymbol][propName] = originalObject[propName];
                }
            }

            // Turn the crons in the object into Cron objects
            this[objectSymbol].cron = {};
            if (originalObject.cron) {
                _.forEach(originalObject.cron, function (cron, key) {
                    this[objectSymbol].cron[key] = new Cron(this, key, cron);
                }, this);
            }

            // Turn the directories in the object into Directory objects
            this[objectSymbol].directories = {};
            if (originalObject.directories) {
                _.forEach(originalObject.directories, function (directory, key) {
                    this[objectSymbol].directories[key] = new Directory(directory);
                }, this);
            }

            // Turn the data, run and layers in the object into Layer objects
            this[objectSymbol].layers = {};
            if (originalObject.data) {
                _.forEach(originalObject.data, function (layer, key) {
                    this[objectSymbol].layers[key] = new DataLayer(this, key, layer);
                }, this);
            }

            if (originalObject.run) {
                _.forEach(originalObject.run, function (layer, key) {
                    this[objectSymbol].layers[key] = new RunLayer(this, key, layer);
                }, this);
            }

            if (originalObject.layers) {
                _.forEach(originalObject.layers, function (layer, key) {
                    this[objectSymbol].layers[key] = new Layer(this, key, layer);
                }, this);
            }
        }

        /**
         * Gets the auto mounted DataLayers for this application if any.
         *
         * @returns {DataLayer[]}
         */
        get autoMounts() {
            return _.where(_.where(this.layers, {dataOnly: true}), {autoMount: true}) || [];
        }

        /**
         * Gets the internal name of this application, the one it's defined with and used in commands. It must be alphanumeric only.
         *
         * @returns {String}
         */
        get applicationName() {
            return this[objectSymbol].applicationName;
        }

        /**
         * Gets the cron jobs of this application.
         *
         * @returns {Cron[]}
         */
        get crons() {
            return this[objectSymbol].cron || {};
        }

        /**
         * Gets the description of this application.
         *
         * @returns {String}
         */
        get description() {
            return this[objectSymbol].description;
        }

        /**
         * Gets the directories of this application.
         *
         * @returns {Directory[]}
         */
        get directories() {
            return this[objectSymbol].directories || {};
        }

        /**
         * Gets the path to the folder where this application is stored.
         *
         * @returns {String}
         */
        get directory() {
            return path.join(brain.getApplicationsDirectory(), this.applicationName);
        }

        /**
         * Gets the layers for this application. A layer is a single component (MySQL, nginx, PHP, NodeJS etc) of this whole application.
         *
         * @returns {Layer[]}
         */
        get layers() {
            return this[objectSymbol].layers || {};
        }

        /**
         * Gets the name of this application.
         *
         * @returns {String}
         */
        get name() {
            return this[objectSymbol].name;
        }

        /**
         * Gets the path to the adm-util.js file for this application.
         *
         * @returns {String}
         */
        get utilFile() {
            return path.join(this.directory, 'adm-util.js');
        }

        /**
         * Gets the modules needed for the util file for this application.
         *
         * @returns {Object}
         */
        get utilModules() {
            let neededModules = require(this.utilFile).modules;
            let modules = {};

            if (neededModules) {
                _.forEach(neededModules, function (module) {
                    if (typeof module === 'object') {
                        if (module[Object.keys(module)[0]] === '{ADMBrain}') {
                            modules[Object.keys(module)[0]] = brain;
                        } else {
                            modules[Object.keys(module)[0]] = require(module[Object.keys(module)[0]]);
                        }
                    } else if (typeof module === 'string') {
                        modules[module] = require(module);
                    }
                });
            }

            return modules;
        }

        /**
         * Gets the variables for this application.
         *
         * @returns {String}
         */
        get variables() {
            return this[objectSymbol].variables || {};
        }

        /**
         * Checks if all the layers passed in as names are up/have been created (for dataOnly layers) or not.
         *
         * @param {String[]} layers - an array of names of layers
         * @returns {Promise}
         */
        areLayersUp(layers) {
            return new Promise(function (resolve) {
                async.each(this.layers, function (layer, next) {
                    if (!layers.some(lName => lName === layer.name)) {
                        // This layer is irrelevant to us
                        return next();
                    }

                    layer.container.inspect(function (err, data) {
                        // Data only containers don't need to be running, but they must be created, so vars check that, else we see if inspect says it's running
                        if (!err && (layer.dataOnly || data.State.Running === true)) {
                            return next();
                        }

                        next(new Error('The layer ' + layer.containerName + ' is not online!'));
                    });
                }, (err) => resolve(!err));
            }.bind(this));
        }

        /**
         * Checks if any of the layers passed in as names are up/have been created (for dataOnly layers) or not.
         *
         * @param {String[]} layers - an array of names of layers
         * @returns {Promise}
         */
        areAnyLayersUp(layers) {
            return new Promise(function (resolve) {
                async.each(this.layers, function (layer, next) {
                    if (!layers.some(lName => lName === layer.name)) {
                        // This layer is irrelevant to us
                        return next();
                    }

                    // Data only containers can be ignored
                    if (layer.dataOnly) {
                        return next();
                    }

                    layer.container.inspect(function (err, data) {
                        if (!err && data.State.Running === true) {
                            return next(true);
                        }

                        next();
                    });
                }, resolve);
            }.bind(this));
        }

        /**
         * Brings this application down by bringing each of it's layers down.
         *
         * @param {Object} options - options passed in from the user
         * @returns {Promise}
         */
        down(options) {
            let self = this;

            brain.logger.benchmark.start('Application Down');

            return new Promise(function (resolve, reject) {
                if (fs.existsSync(this.utilFile)) {
                    let utils = require(this.utilFile);

                    if (typeof utils.preDown === 'function') {
                        utils.preDown(options, this, this.utilModules).then(bringDown).catch(reject);
                    } else {
                        bringDown();
                    }
                } else {
                    bringDown();
                }

                function allDown(err) {
                    if (err) {
                        return reject(err);
                    }

                    brain.logger.benchmark.stop('Application Down');

                    resolve();
                }

                function bringDown() {
                    self.getOrderOfLayers(options).then(function (layersOrder) {
                        let _asyncEachCallback = function (layer, next) {
                            layer.down(options).then(() => next()).catch(next);
                        };

                        if (options.async) {
                            async.each(layersOrder, _asyncEachCallback, allDown);
                        } else {
                            async.eachSeries(layersOrder, _asyncEachCallback, allDown);
                        }
                    }).catch(reject);
                }
            }.bind(this));
        }

        /**
         * This executes the crons for this application.
         *
         * @param {Object} options - options passed in from the user
         * @returns {Promise}
         */
        executeCron(options) {
            return new Promise(function (resolve, reject) {
                let _asyncEachCallback = function (cron, next) {
                    cron.execute(options).then(() => next()).catch(next);
                };

                let crons = _.reject(this.crons, 'shouldExecute', false);

                if (options.async) {
                    async.each(crons, _asyncEachCallback, (err) => err ? reject(err) : resolve());
                } else {
                    async.eachSeries(crons, _asyncEachCallback, (err) => err ? reject(err) : resolve());
                }
            }.bind(this));
        }

        /**
         * Gets the layer object for the given layer name of this application.
         *
         * @param {String} name - the name of the layer to get
         * @returns {Layer|DataLayer|RunLayer|undefined} - the layer with the given name or undefined if it doesn't exist
         */
        getLayer(name) {
            return _.find(this.layers, 'name', name);
        }

        /**
         * Gets the layers for this application as an array.
         *
         * @returns {Layer[]}
         */
        getLayersAsArray() {
            let self = this;
            return Object.keys(this.layers).map(function (key) {
                return self.layers[key];
            });
        }

        /**
         * This sorts out each of this applications layers and puts them in the order needed to start them up in, in order to make sure they start with the correct links and volumes from other
         * containers.
         *
         * @param {Object} options - options passed in from the user
         * @returns {Promise}
         */
        getOrderOfLayers() {
            return new Promise(function (resolve, reject) {
                let initialLayout = [];

                _.forEach(this.layers, function (layer) {
                    // Run only containers don't need to be bought up so we skip them
                    if (!layer.runOnly) {
                        let obj = {
                            layer,
                            name: layer.name,
                            after: layer.dependentLayers
                        };

                        initialLayout.push(obj);
                    }
                });

                let finalLayout = _.remove(initialLayout, function (l) {
                    return l.after.length === 0;
                });

                let attempts = 0;

                function canSort(layer) {
                    return _.every(layer.after, function (l) {
                        return _.some(finalLayout, function (l1) {
                            return l1.layer.name === l;
                        });
                    });
                }

                while (initialLayout.length !== 0 && attempts < 100) {
                    let layer = _.first(initialLayout);

                    let position = -1;

                    if (!canSort(layer)) {
                        /* jshint -W083 */
                        _.remove(initialLayout, function (l) {
                            return layer.layer.name === l.layer.name;
                        });
                        /* jshint +W083 */

                        initialLayout.push(layer);

                        attempts++;

                        continue;
                    }

                    /* jshint -W083 */
                    layer.after.forEach(function (after) {
                        let indexOf = -1;

                        for (let i = 0; i < finalLayout.length; i++) {
                            if (finalLayout[i].layer.name === after) {
                                indexOf = i;
                            }
                        }

                        if (indexOf > position) {
                            position = indexOf;
                        }
                    });
                    /* jshint +W083 */

                    finalLayout.splice(position + 1, 0, layer);

                    /* jshint -W083 */
                    _.remove(initialLayout, function (l) {
                        return layer.layer.name === l.layer.name;
                    });
                    /* jshint +W083 */
                }

                if (attempts === 100) {
                    reject(new Error(`Cannot start application ${this.name}! Can't determine the correct order to start the machines up! Please check your application json file and try again!`));
                } else {
                    let sortedLayers = [];

                    finalLayout.forEach(function (l) {
                        sortedLayers.push(l.layer);
                    });

                    resolve(sortedLayers);
                }
            }.bind(this));
        }

        /**
         * Checks to see if this application and all of it's necessary layers are up.
         *
         * @returns {Promise}
         */
        isAnyUp() {
            return new Promise(function (resolve) {
                async.each(this.layers, function (layer, next) {
                    layer.container.inspect(function (err, data) {
                        // Data only containers don't need to be running, but they must be created, so vars check that, else we see if inspect says it's running
                        if (!err && (data.State.Running === true)) {
                            return next(true);
                        }

                        next();
                    });
                }, (err) => resolve(err));
            }.bind(this));
        }

        /**
         * Checks to see if this application and all of it's necessary layers are up.
         *
         * @returns {Promise}
         */
        isAllUp() {
            return new Promise(function (resolve) {
                async.each(this.layers, function (layer, next) {
                    // Run only containers can be ignored
                    if (layer.runOnly) {
                        return next();
                    }

                    layer.container.inspect(function (err, data) {
                        // Data only containers don't need to be running, but they must be created, so vars check that, else we see if inspect says it's running
                        if (!err && (layer.dataOnly || data.State.Running === true)) {
                            return next();
                        }

                        next(new Error());
                    });
                }, (err) => resolve(!err));
            }.bind(this));
        }

        /**
         * Checks to see if this application has a layer with the given name.
         *
         * @param {String} layerName - the name of the layer
         * @returns {Promise}
         */
        isLayer(layerName) {
            return new Promise(function (resolve) {
                resolve(_.some(this.layers, function (layer) {
                    return layer.name === layerName;
                }));
            }.bind(this));
        }

        /**
         * This logs this applications status to the logger.
         *
         * @param {Object} options - options passed in from the user
         * @returns {Promise}
         */
        logStatus(options) {
            let self = this;

            return new Promise(function (resolve) {
                if (options.up) {
                    this.areAnyLayersUp(this.getLayersAsArray().map(layer => layer.name)).then((anyUp) => anyUp ? logIt() : resolve());
                } else {
                    logIt();
                }

                function logIt() {
                    brain.logger.raw(self.applicationName.cyan);
                    brain.logger.line();

                    async.eachSeries(self.getLayersAsArray(), function (layer, next) {
                        if (!layer.dataOnly && !layer.runOnly) {
                            brain.logger.raw(sprintf('%15s: ', layer.name));
                            layer.isUp().then(function (isUp) {
                                brain.logger.raw(isUp ? 'Online'.green : 'Offline'.red);

                                if (isUp) {
                                    layer.container.inspect(function (err, data) {
                                        if (err) {
                                            brain.logger.line();
                                            return next();
                                        }

                                        brain.logger.raw(' (ID: ' + data.Config.Hostname + ')');
                                        brain.logger.raw(' (Uptime: ' + brain.parseTimeDifference(moment(data.State.StartedAt).toDate()) + ')');

                                        brain.logger.line();
                                        return next();
                                    });
                                } else {
                                    brain.logger.line();
                                    return next();
                                }
                            }).catch(next);
                        } else {
                            next();
                        }
                    }, function () {
                        brain.logger.line();

                        resolve();
                    });
                }
            }.bind(this));
        }

        /**
         * Restarts this application by restarting each of it's layers.
         *
         * @param {Object} options - options passed in from the user
         * @returns {Promise}
         */
        restart(options) {
            brain.logger.benchmark.start('Application Restart');

            return new Promise(function (resolve, reject) {
                this.getOrderOfLayers(options).then(function (layersOrder) {
                    async.eachSeries(layersOrder, function (layer, next) {
                        layer.restart(options).then(() => next()).catch(next);
                    }, function (err) {
                        if (err) {
                            return reject(err);
                        }

                        brain.logger.benchmark.stop('Application Restart');

                        resolve();
                    });
                }).catch(reject);
            }.bind(this));
        }

        /**
         * Sets up this applications directories in the hosts filesystem.
         *
         * @param {Object} options - options passed in from the user
         */
        setupDirectories(options) {
            _.forEach(this.directories, function (directory) {
                if (!fs.existsSync(directory.path)) {
                    if (!options.quiet) {
                        brain.logger.info('Creating directory ' + directory.path);
                    }

                    mkdirp.sync(directory.path);
                }
            });

            _.forEach(this.layers, function (layer) {
                _.forEach(layer.volumes, function (volume) {
                    if (volume.directory) {

                        if (!fs.existsSync(volume.host)) {
                            if (!options.quiet) {
                                brain.logger.info('Creating directory ' + volume.host);
                            }

                            mkdirp.sync(volume.host);
                        }
                    }
                });
            });
        }

        /**
         * Brings this application up by bringing each of it's layers up.
         *
         * @param {Object} options - options passed in from the user
         * @returns {Promise}
         */
        up(options) {
            return new Promise(function (resolve, reject) {
                let self = this;

                brain.logger.benchmark.start('Application Up');

                if (fs.existsSync(this.utilFile)) {
                    let utils = require(this.utilFile);

                    if (typeof utils.preUp === 'function') {
                        utils.preUp(options, this, this.utilModules).then(bringUp).catch(reject);
                    } else {
                        bringUp();
                    }
                } else {
                    bringUp();
                }

                function bringUp() {
                    self.getOrderOfLayers(options).then(function (layersOrder) {
                        async.eachSeries(layersOrder, function (layer, next) {
                            layer.up(options).then(() => next()).catch(next);
                        }, function (err) {
                            if (err) {
                                return reject(err);
                            }

                            brain.logger.benchmark.stop('Application Up');

                            resolve();
                        });
                    }).catch(reject);
                }
            }.bind(this));
        }
    };
})();
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

    let fs = require('fs');
    let _ = require('lodash');
    let path = require('path');
    let async = require('async');
    let mkdirp = require('mkdirp');

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

            // Turn the layers in the object into Layer objects
            this[objectSymbol].layers = {};
            if (originalObject.layers) {
                _.forEach(originalObject.layers, function (layer, key) {
                    this[objectSymbol].layers[key] = new Layer(this, key, layer);
                }, this);
            }
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
         * @returns {Object}
         */
        get directories() {
            return this[objectSymbol].directories;
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
         * Checks if all the layers passed in as names are up/have been created (for dataOnly layers) or not.
         *
         * @param {String[]} layers - an array of names of layers
         * @param {Application~areLayersUpCallback} callback - the callback for when we're done
         */
        areLayersUp(layers, callback) {
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
            }, function (err) {
                callback(!err);
            });
        }

        /**
         * Brings this application down by bringing each of it's layers down.
         *
         * @param {Object} options - options passed in from the user
         * @param {Application~downCallback} callback - the callback for when we're done
         */
        down(options, callback) {
            this.getOrderOfLayers(options, function (err, layersOrder) {
                if (err) {
                    return callback(err);
                }

                let _asyncEachCallback = function (layer, next) {
                    layer.down(options, next);
                };

                if (options.async) {
                    async.each(layersOrder, _asyncEachCallback, callback);
                } else {
                    async.eachSeries(layersOrder, _asyncEachCallback, callback);
                }
            });
        }

        /**
         * Gets the layer object for the given layer name of this application.
         *
         * @param {String} name - the name of the layer to get
         * @returns {Layer|undefined} - the layer with the given name or undefined if it doesn't exist
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
         * @param {Application~getOrderOfLayersCallback} callback - the callback for when we're done
         */
        getOrderOfLayers(options, callback) {
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
                callback(new Error('Cannot start application ' + this.name + '! Can\'t determine the correct order to start the machines up! Please check your application json file and try again!'));
            } else {
                let sortedLayers = [];

                finalLayout.forEach(function (l) {
                    sortedLayers.push(l.layer);
                });

                callback(null, sortedLayers);
            }
        }

        /**
         * Checks to see if this application and all of it's necessary layers are up.
         *
         * @param {Application~isUpCallback} callback - the callback for when we're done
         */
        isAnyUp(callback) {
            async.each(this.layers, function (layer, next) {
                layer.container.inspect(function (err, data) {
                    // Data only containers don't need to be running, but they must be created, so vars check that, else we see if inspect says it's running
                    if (!err && (data.State.Running === true)) {
                        return next(new Error('The layer ' + layer.containerName + ' is online!'));
                    }

                    next();
                });
            }, function (err) {
                callback(err);
            });
        }

        /**
         * Checks to see if this application and all of it's necessary layers are up.
         *
         * @param {Application~isUpCallback} callback - the callback for when we're done
         */
        isAllUp(callback) {
            async.each(this.layers, function (layer, next) {
                layer.container.inspect(function (err, data) {
                    // Data only containers don't need to be running, but they must be created, so vars check that, else we see if inspect says it's running
                    if (!err && (layer.dataOnly || data.State.Running === true)) {
                        return next();
                    }

                    next(new Error('The layer ' + layer.containerName + ' is not online!'));
                });
            }, function (err) {
                callback(!err);
            });
        }

        /**
         * Checks to see if this application has a layer with the given name.
         *
         * @param {String} layerName - the name of the layer
         * @param {Application~isLayerCallback} callback - the callback for when we're done
         */
        isLayer(layerName, callback) {
            callback(_.some(this.layers, function (layer) {
                return layer.name === layerName;
            }));
        }

        /**
         * Restarts this application by restarting each of it's layers.
         *
         * @param {Object} options - options passed in from the user
         * @param {Application~restartCallback} callback - the callback for when we're done
         */
        restart(options, callback) {
            this.getOrderOfLayers(options, function (err, layersOrder) {
                if (err) {
                    return callback(err);
                }

                let _asyncEachCallback = function (layer, next) {
                    layer.restart(options, next);
                };

                if (options.async) {
                    async.each(layersOrder, _asyncEachCallback, callback);
                } else {
                    async.eachSeries(layersOrder, _asyncEachCallback, callback);
                }
            });
        }

        /**
         * Sets up this applications directories in the hosts filesystem.
         *
         * @param {Object} options - options passed in from the user
         */
        setupDirectories(options) {
            _.forEach(this.directories, function (directory) {
                let thisPath = path.join(brain.settings.directories.storage, directory.path);

                if (!fs.existsSync(thisPath)) {
                    if (!options.quiet) {
                        brain.logger.info('Creating directory ' + thisPath);
                    }

                    mkdirp.sync(thisPath);
                }
            });
        }

        /**
         * Brings this application up by bringing each of it's layers up.
         *
         * @param {Object} options - options passed in from the user
         * @param {Application~upCallback} callback - the callback for when we're done
         */
        up(options, callback) {
            this.getOrderOfLayers(options, function (err, layersOrder) {
                if (err) {
                    return callback(err);
                }

                let _asyncEachCallback = function (layer, next) {
                    layer.up(options, next);
                };

                if (options.async) {
                    async.each(layersOrder, _asyncEachCallback, callback);
                } else {
                    async.eachSeries(layersOrder, _asyncEachCallback, callback);
                }
            });
        }
    };
})();

/**
 * This is the callback used when checking to see if given layers are up/created or not.
 *
 * @callback Application~areLayersUpCallback
 * @param {Boolean} areUp - if all the layers specified are up/created
 */

/**
 * This is the callback used when bringing an application down.
 *
 * @callback Application~downCallback
 * @param {Error|undefined} err - the error (if any) that occurred while trying to bring this application down
 */

/**
 * This is the callback used when bringing an application down.
 *
 * @callback Application~getOrderOfLayersCallback
 * @param {Error|undefined} err - the error (if any) that occurred while trying to bring this application down
 * @param {Layer[]} layers - an array of each of the layers in the order the should be started
 */

/**
 * This is the callback used when checking to see if an application is up or not.
 *
 * @callback Application~isUpCallback
 * @param {Boolean} up - if this application is up or not
 */

/**
 * This is the callback used when checking to see if this application has a layer with the given name.
 *
 * @callback Application~isLayerCallback
 * @param {Boolean} up - if there is a layer with this name
 */

/**
 * This is the callback used when restarting an application.
 *
 * @callback Application~restartCallback
 * @param {Error|undefined} err - the error (if any) that occurred while trying to restart this application
 */

/**
 * This is the callback used when we attempt to bring an application up.
 *
 * @callback Application~upCallback
 * @param {Error|undefined} err - the error (if any) that occurred while trying to bring this application up
 */
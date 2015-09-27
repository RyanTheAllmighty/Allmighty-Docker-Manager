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

"use strict";

let brain = require('../brain');

let Layer = require('./layer');

let fs = require('fs');
let _ = require('lodash');
let path = require('path');
let async = require('async');
let mkdirp = require('mkdirp');
let sprintf = require("sprintf-js").sprintf;

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
     * Gets if this application can run Artisan.
     *
     * @returns {Boolean}
     */
    get runsArtisan() {
        return this[objectSymbol].runsArtisan || false;
    }

    /**
     * Gets if this application can run Composer.
     *
     * @returns {Boolean}
     */
    get runsComposer() {
        return this[objectSymbol].runsComposer || false;
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
     * This sorts out each of this applications layers and puts them in the order needed to start them up in, in order to make sure they start with the correct links and volumes from other containers.
     *
     * @param {Object} options - options passed in from the user
     * @param {Application~getOrderOfLayersCallback} callback - the callback for when we're done
     */
    getOrderOfLayers(options, callback) {
        let initialLayout = [];

        _.forEach(this.layers, function (layer) {
            let obj = {
                layer,
                name: layer.name,
                after: []
            };

            if (layer.links.length > 0) {
                // There is one or more links, so we need to figure out what we need to startup before this layer
                _.forEach(layer.links, function (link) {
                    obj.after.push(link.container);
                });
            }

            if (layer.volumesFrom.length > 0) {
                // There is one or more volumesFrom, so we need to figure out what we need to startup before this layer
                _.forEach(layer.volumesFrom, function (volumeFrom) {
                    obj.after.push(volumeFrom.container);
                });
            }

            initialLayout.push(obj);
        });

        let finalLayout = _.remove(initialLayout, function (l) {
            return l.after.length === 0;
        });

        let attempts = 0;

        function canSort(layer) {
            return _.every(layer.after, function (l) {
                return _.some(finalLayout, function (l1) {
                    return l1.layer.name == l;
                });
            });
        }

        while (initialLayout.length !== 0 && attempts < 100) {
            let layer = _.first(initialLayout);

            let position = -1;

            if (!canSort(layer)) {
                _.remove(initialLayout, function (l) {
                    return layer.layer.name == l.layer.name;
                });

                initialLayout.push(layer);

                attempts++;

                continue;
            }

            layer.after.forEach(function (after) {
                let indexOf = -1;

                for (let i = 0; i < finalLayout.length; i++) {
                    if (finalLayout[i].layer.name == after) {
                        indexOf = i;
                    }
                }

                if (indexOf > position) {
                    position = indexOf;
                }
            });

            finalLayout.splice(position + 1, 0, layer);

            _.remove(initialLayout, function (l) {
                return layer.layer.name == l.layer.name;
            });
        }

        if (attempts == 100) {
            callback(new Error('Cannot start application ' + this.name + ' as we cannot determine the correct order to start the machines up! Please check your application json file and try again!'));
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
                // Data only containers don't need to be running, but they must be created, so lets check that, else we see if inspect says it's running
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
                // Data only containers don't need to be running, but they must be created, so lets check that, else we see if inspect says it's running
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
            return layer.name == layerName;
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
     * This runs Artisan on the container (if we can) and attaches to the stdout, stdin and stderr to allow input and output from the container process.
     *
     * @param {Object} options - options passed in from the user
     * @param {Application~runArtisanCallback} callback - the callback for when we're done
     */
    runArtisan(options, callback) {
        if (!this.runsArtisan) {
            return callback(new Error('Artisan is not enabled for this application!'));
        }

        let imageName = sprintf('%s/%s', brain.settings.repositoryURL, 'php');

        let dockerArguments = ['php', 'artisan', '--ansi'].concat(options._raw.slice(options._raw.indexOf(this.applicationName) + 1));

        let dockerOptions = {
            AttachStdin: true,
            AttachStdout: true,
            AttachStderr: true,
            Tty: true,
            OpenStdin: true,
            StdinOnce: false,
            Cmd: dockerArguments,
            Dns: brain.settings.dns,
            Image: imageName,
            WorkingDir: '/mnt/site',
            name: sprintf('%s_artisan', this.applicationName),
            HostConfig: {
                VolumesFrom: [
                    sprintf('%s_data', this.applicationName)
                ]
            }
        };

        brain.run(dockerOptions, callback);
    }

    /**
     * This runs Composer on the container (if we can) and attaches to the stdout, stdin and stderr to allow input and output from the container process.
     *
     * @param {Object} options - options passed in from the user
     * @param {Application~runComposerCallback} callback - the callback for when we're done
     */
    runComposer(options, callback) {
        if (!this.runsComposer) {
            return callback(new Error('Composer is not enabled for this application!'));
        }

        let imageName = sprintf('%s/%s', brain.settings.repositoryURL, 'php');

        let dockerArguments = ['composer', '--ansi'].concat(options._raw.slice(options._raw.indexOf(this.applicationName) + 1));

        let dockerOptions = {
            AttachStdin: true,
            AttachStdout: true,
            AttachStderr: true,
            Tty: true,
            OpenStdin: true,
            StdinOnce: false,
            Cmd: dockerArguments,
            Dns: brain.settings.dns,
            Image: imageName,
            WorkingDir: '/mnt/site',
            name: sprintf('%s_composer', this.applicationName),
            HostConfig: {
                VolumesFrom: [
                    sprintf('%s_data', this.applicationName)
                ]
            }
        };

        brain.run(dockerOptions, callback);
    }

    /**
     * Sets up this applications directories in the hosts filesystem.
     *
     * @param {Object} options - options passed in from the user
     */
    setupDirectories(options) {
        _.forEach(this.directories, function (directory, key) {
            let thisPath = path.join(brain.settings.directories.storage, directory.path);

            if (!fs.existsSync(thisPath)) {
                if (!options.quiet) {
                    console.log('Creating directory ' + thisPath);
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
 * This is the callback used when running Artisan on an application.
 *
 * @callback Application~runArtisanCallback
 * @param {Error|undefined} err - the error (if any) that occurred while trying to run Artisan
 */

/**
 * This is the callback used when running Composer on an application.
 *
 * @callback Application~runComposerCallback
 * @param {Error|undefined} err - the error (if any) that occurred while trying to run Composer
 */

/**
 * This is the callback used when we attempt to bring an application up.
 *
 * @callback Application~upCallback
 * @param {Error|undefined} err - the error (if any) that occurred while trying to bring this application up
 */
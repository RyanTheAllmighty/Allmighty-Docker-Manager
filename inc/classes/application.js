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

// Load the brain in for the application
var brain = require('../brain');

var fs = require('fs');
var _ = require('lodash');
var path = require('path');
var async = require('async');
var mkdirp = require('mkdirp');
var sprintf = require("sprintf-js").sprintf;

var Layer = require('./layer');

// Symbol for storing the objects properties
var objectSymbol = Symbol();

module.exports = class Application {
    constructor(name, object) {
        var originalObject = {};

        if (name && object) {
            originalObject = object;
        } else {
            originalObject = require(path.join(brain.getApplicationsDirectory(), name + '.json'));
        }

        this[objectSymbol] = {};
        this[objectSymbol].applicationName = name;

        for (var propName in originalObject) {
            if (originalObject.hasOwnProperty(propName)) {
                this[objectSymbol][propName] = originalObject[propName];
            }
        }

        this[objectSymbol].layers = {};
        if (originalObject.layers) {
            _.forEach(originalObject.layers, function (layer, key) {
                this[objectSymbol].layers[key] = new Layer(key, layer);
            }, this);
        }
    }

    setupDirectories(options) {
        _.forEach(this.directories, function (directory) {
            var thisPath = path.join(brain.settings.directories.storage, directory.path);

            if (!fs.existsSync(thisPath)) {
                if (!options.quiet) {
                    console.log('Creating directory ' + thisPath);
                }

                mkdirp.sync(thisPath);
            }
        });
    }

    isLayerUp(layerName, callback) {
        let self = this;

        brain.getRunningContainerNames(function (err, containers) {
            if (err) {
                return callback(err);
            }

            var isUp = _.some(containers, function (container) {
                return container == sprintf('%s_%s', self.applicationName, layerName);
            });

            callback(isUp);
        });
    }

    getLayerContainer(layerName, callback) {
        let self = this;

        this.isLayerUp(layerName, function (up) {
            if (!up) {
                return callback(new Error('The layer with a name of ' + layerName + ' isn\'t online!'));
            }

            callback(null, brain.docker.getContainer(sprintf('%s_%s', self.applicationName, layerName)));
        });
    }

    runArtisan(options, callback) {
        if (!this.runsArtisan) {
            return callback(new Error('Artisan is not enabled for this application!'));
        }

        let imageName = sprintf('%s/%s', brain.settings.repositoryURL, 'php');

        let dockerArguments = ['php', 'artisan', '--ansi'].concat(options._raw.slice(options._raw.indexOf(this.applicationName) + 1));

        let dockerOptions = {
            VolumesFrom: [
                sprintf('%s_data', this.applicationName)
            ],
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
            name: sprintf('%s_artisan', this.applicationName)
        };

        brain.run(dockerOptions, callback);
    }

    runComposer(options, callback) {
        if (!this.runsComposer) {
            return callback(new Error('Composer is not enabled for this application!'));
        }

        let imageName = sprintf('%s/%s', brain.settings.repositoryURL, 'php');

        let dockerArguments = ['composer', '--ansi'].concat(options._raw.slice(options._raw.indexOf(this.applicationName) + 1));

        let dockerOptions = {
            VolumesFrom: [
                sprintf('%s_data', this.applicationName)
            ],
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
            name: sprintf('%s_composer', this.applicationName)
        };

        brain.run(dockerOptions, callback);
    }

    up(options, callback) {
        let self = this;

        this.getOrderOfLayers(options, function (err, layersOrder) {
            if (err) {
                return callback(err);
            }

            let _asyncEachCallback = function (layer, next) {
                self.isLayerUp(layer.name, function (isUp) {
                    if (isUp) {
                        return next();
                    }

                    let bringUp = function () {
                        let layerName = layer.getContainerName(self.applicationName);

                        brain.docker.getContainer(layerName).remove(function () {
                            brain.docker.createContainer(layer.getDockerOptions(self.applicationName), function (err, container) {
                                if (err) {
                                    return callback(err);
                                }

                                // This is a data only container, so we don't need to run it
                                if (layer.dataOnly) {
                                    console.log(layerName + ' data container has been created!');
                                    return next();
                                }

                                container.start(function (err, d) {
                                    if (err) {
                                        return next(err);
                                    }

                                    console.log(layerName + ' is now up!');

                                    next();
                                });
                            });
                        });
                    };

                    let pullAndUp = function () {
                        layer.pull(options, function (err) {
                            if (err) {
                                return next(err);
                            }

                            bringUp();
                        });
                    };

                    // Pull the layers image so we make sure we're up to date
                    if (!options.pull) {
                        brain.docker.getImage(layer.image).get(function (err) {
                            if (err) {
                                pullAndUp();
                            } else {
                                bringUp();
                            }
                        });
                    } else {
                        pullAndUp();
                    }
                });
            };

            if (options.async) {
                async.each(layersOrder, _asyncEachCallback, callback);
            } else {
                async.eachSeries(layersOrder, _asyncEachCallback, callback);
            }
        });
    }

    down(options, callback) {
        let self = this;

        this.getOrderOfLayers(options, function (err, layersOrder) {
            if (err) {
                return callback(err);
            }

            let _asyncEachCallback = function (layer, next) {
                self.isLayerUp(layer.name, function (isUp) {
                    if (!isUp) {
                        return next();
                    }

                    self.getLayerContainer(layer.name, function (err, container) {
                        if (err) {
                            return next(err);
                        }

                        container.stop(function (err) {
                            if (err) {
                                return next(err);
                            }

                            console.log(layer.getContainerName(self.applicationName) + ' is now down!');

                            if (options.rm) {
                                container.remove(next);
                            } else {
                                next();
                            }
                        });
                    });
                });
            };

            if (options.async) {
                async.each(layersOrder, _asyncEachCallback, callback);
            } else {
                async.eachSeries(layersOrder, _asyncEachCallback, callback);
            }
        });
    }

    restart(options, callback) {
        let self = this;

        this.getOrderOfLayers(options, function (err, layersOrder) {
            if (err) {
                return callback(err);
            }

            let _asyncEachCallback = function (layer, next) {
                self.isLayerUp(layer.name, function (isUp) {
                    if (!isUp) {
                        return next();
                    }

                    self.getLayerContainer(layer.name, function (err, container) {
                        if (err) {
                            return next(err);
                        }

                        container.restart(function (err) {
                            if (err) {
                                return next(err);
                            }

                            console.log(layer.getContainerName(self.applicationName) + ' has been restarted!');

                            next();
                        });
                    });
                });
            };

            if (options.async) {
                async.each(layersOrder, _asyncEachCallback, callback);
            } else {
                async.eachSeries(layersOrder, _asyncEachCallback, callback);
            }
        });
    }

    /**
     * This sorts out all of the layers for this application and returns to the callback an array of layers in the
     * order they need to be started up in order to ensure links and volumes from other containers work as expected.
     */
    getOrderOfLayers(options, callback) {
        let initialLayout = [];

        _.forEach(this.layers, function (layer) {
            var obj = {
                layer,
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
            return l.after.length !== 0;
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
            return callback(new Error('Cannot start application ' + this.name + ' as we cannot determine the correct order to start the machines up! Please check your application json file and try again!'));
        }

        let sortedLayers = [];

        finalLayout.forEach(function (l) {
            sortedLayers.push(l.layer);
        });

        callback(null, sortedLayers);
    }

    get applicationName() {
        return this[objectSymbol].applicationName;
    }

    get name() {
        return this[objectSymbol].name;
    }

    get description() {
        return this[objectSymbol].description;
    }

    get directories() {
        return this[objectSymbol].directories || [];
    }

    get layers() {
        return this[objectSymbol].layers || {};
    }

    get runsArtisan() {
        return this[objectSymbol].runsArtisan || false;
    }

    get runsComposer() {
        return this[objectSymbol].runsComposer || false;
    }

    get dockerComposeYML() {
        return path.join(brain.getApplicationsDirectory(), this.applicationName + '.yml');
    }
};
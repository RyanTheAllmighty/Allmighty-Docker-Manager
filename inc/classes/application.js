"use strict";

// Load the brain in for the application
var brain = require('../brain');

var fs = require('fs');
var _ = require('lodash');
var path = require('path');
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

            layersOrder.forEach(function (layer) {
                //this.docker.createContainer(layer.getDockerOptions(this.applicationName), function (err, container) {
                //    if (err) {
                //        return callback(err);
                //    }
                //});
                console.log(layer.getDockerOptions(self.applicationName));
            });

            callback();
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

    down(options, callback) {
        this.downWithCompose(options, callback);
    }

    downWithCompose(options, callback) {
        var dockerArgs = [];

        dockerArgs.push('-f');
        dockerArgs.push(this.dockerComposeYML);
        dockerArgs.push('-p');
        dockerArgs.push(this.applicationName);
        dockerArgs.push('stop');

        brain.spawnDockerComposeProcess(options, dockerArgs, callback);
    }

    restart(options, callback) {
        this.restartWithCompose(options, callback);
    }

    restartWithCompose(options, callback) {
        var dockerArgs = [];

        dockerArgs.push('-f');
        dockerArgs.push(this.dockerComposeYML);
        dockerArgs.push('-p');
        dockerArgs.push(this.applicationName);
        dockerArgs.push('restart');

        brain.spawnDockerComposeProcess(options, dockerArgs, callback);
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
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
    constructor(name) {
        var originalObject = {};

        if (name instanceof Object) {
            originalObject = name;
        } else {
            originalObject = require(path.join(brain.getApplicationsDirectory(), name + '.json'));
        }

        this[objectSymbol] = {};

        for (var propName in originalObject) {
            if (originalObject.hasOwnProperty(propName)) {
                this[objectSymbol][propName] = originalObject[propName];
            }
        }

        this[objectSymbol].layers = {};
        if (originalObject.layers) {
            _.forEach(originalObject.layers, function (layer, key) {
                this[objectSymbol].layers[key] = new Layer(layer);
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
                return container == sprintf('%s_%s', self.name, layerName);
            });

            callback(isUp);
        });
    }

    runArtisan(options, callback) {
        if (!this.runsArtisan) {
            return callback(new Error('Artisan is not enabled for this application!'));
        }

        let imageName = sprintf('%s/%s', brain.settings.repositoryURL, 'php');

        let dockerArguments = ['php', 'artisan', '--ansi'].concat(options._raw.slice(options._raw.indexOf(this.name) + 1));

        let dockerOptions = {
            VolumesFrom: [
                sprintf('%s_data', this.name)
            ],
            AttachStdin: true,
            AttachStdout: true,
            AttachStderr: true,
            Tty: true,
            OpenStdin: true,
            StdinOnce: false,
            Cmd: dockerArguments,
            Dns: ['8.8.8.8', '8.8.4.4'],
            Image: imageName,
            WorkingDir: '/mnt/site',
            name: sprintf('%s_artisan', this.name)
        };

        brain.run(dockerOptions, callback);
    }

    runComposer(options, callback) {
        if (!this.runsComposer) {
            return callback(new Error('Composer is not enabled for this application!'));
        }

        let imageName = sprintf('%s/%s', brain.settings.repositoryURL, 'php');

        let dockerArguments = ['composer', '--ansi'].concat(options._raw.slice(options._raw.indexOf(this.name) + 1));

        let dockerOptions = {
            VolumesFrom: [
                sprintf('%s_data', this.name)
            ],
            AttachStdin: true,
            AttachStdout: true,
            AttachStderr: true,
            Tty: true,
            OpenStdin: true,
            StdinOnce: false,
            Cmd: dockerArguments,
            Dns: ['8.8.8.8', '8.8.4.4'],
            Image: imageName,
            WorkingDir: '/mnt/site',
            name: sprintf('%s_composer', this.name)
        };

        brain.run(dockerOptions, callback);
    }

    up(options, callback) {
        this.upWithCompose(options, callback);
    }

    upWithCompose(options, callback) {
        var dockerArgs = [];

        dockerArgs.push('-f');
        dockerArgs.push(this.dockerComposeYML);
        dockerArgs.push('-p');
        dockerArgs.push(this.name);
        dockerArgs.push('up');
        dockerArgs.push('-d');

        brain.spawnDockerComposeProcess(options, dockerArgs, callback);
    }

    down(options, callback) {
        this.downWithCompose(options, callback);
    }

    downWithCompose(options, callback) {
        var dockerArgs = [];

        dockerArgs.push('-f');
        dockerArgs.push(this.dockerComposeYML);
        dockerArgs.push('-p');
        dockerArgs.push(this.name);
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
        dockerArgs.push(this.name);
        dockerArgs.push('restart');

        brain.spawnDockerComposeProcess(options, dockerArgs, callback);
    }

    restart(options, callback) {
        this.restartWithCompose(options, callback);
    }

    get
    name() {
        return this[objectSymbol].name.toLowerCase();
    }

    get
    description() {
        return this[objectSymbol].description;
    }

    get
    directories() {
        return this[objectSymbol].directories || [];
    }

    get
    layers() {
        return this[objectSymbol].layers || {};
    }

    get
    runsArtisan() {
        return this[objectSymbol].runsArtisan || false;
    }

    get
    runsComposer() {
        return this[objectSymbol].runsComposer || false;
    }

    get
    dockerComposeYML() {
        return path.join(brain.getApplicationsDirectory(), this.name + '.yml');
    }
};
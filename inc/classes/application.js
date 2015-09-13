"use strict";

var fs = require('fs');
var _ = require('lodash');
var path = require('path');
var mkdirp = require('mkdirp');

var Layer = require('./layer');

// Load the brain in for the application
var brain = require('../brain');

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
            var thisPath = path.join(docker.settings.directories.storage, directory.path);

            if (!fs.existsSync(thisPath)) {
                if (!options.quiet) {
                    console.log('Creating directory ' + thisPath);
                }

                mkdirp.sync(thisPath);
            }
        });
    }

    up(options, callback) {
        this.upWithCompose(options, callback);
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

    down(options, callback) {
        this.downWithCompose(options, callback);
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

    get dockerComposeYML() {
        return path.join(brain.getApplicationsDirectory(), this.name + '.yml');
    }
};
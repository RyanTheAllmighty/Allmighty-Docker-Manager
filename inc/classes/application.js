"use strict";

var docker = require('../docker');

var fs = require('fs');
var _ = require('lodash');
var path = require('path');
var mkdirp = require('mkdirp');

var Layer = require('./layer');

module.exports = class Application {
    constructor(name) {
        var originalObject = {};

        if (name instanceof Object) {
            originalObject = name;
        } else {
            originalObject = require(docker.getApplicationJSON(name));
        }

        for (var propName in originalObject) {
            if (originalObject.hasOwnProperty(propName)) {
                this[propName] = originalObject[propName];
            }
        }

        this.layers = {};
        if (originalObject.layers) {
            _.forEach(originalObject.layers, function (layer, key) {
                this.layers[key] = new Layer(layer);
            }, this);
        }
    }

    setupDirectories() {
        _.forEach(this.getDirectories(), function (directory) {
            var thisPath = path.join(docker.settings.directories.storage, directory.path);

            if (!fs.existsSync(thisPath)) {
                if (!options.quiet) {
                    console.log('Creating directory ' + thisPath);
                }

                mkdirp.sync(thisPath);
            }
        });
    }

    getName() {
        return this.name;
    }

    getDescription() {
        return this.description;
    }

    getDirectories() {
        return this.directories || [];
    }

    getLayer(name) {
        return this.layers[name];
    }

    getLayers() {
        return this.layers || {};
    }
};
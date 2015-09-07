var docker = require('../docker');

var fs = require('fs');
var _ = require('lodash');
var path = require('path');
var mkdirp = require('mkdirp');

var Layer = require('./layer');

var methods = Application.prototype;

function Application(name) {
    var object = {};

    if (name instanceof Object) {
        object = name;
    } else {
        object = require(docker.getApplicationJSON(name));
    }

    for (var propName in object) {
        if (object.hasOwnProperty(propName)) {
            this[propName] = object[propName];
        }
    }

    this.layers = {};
    if (object.layers) {
        _.forEach(object.layers, function (layer, key) {
            this.layers[key] = new Layer(layer);
        }, this);
    }
}

methods.setupDirectories = function (options) {
    _.forEach(this.getDirectories(), function (directory) {
        var thisPath = path.join(docker.settings.directories.storage, directory.path);

        if (!fs.existsSync(thisPath)) {
            if (!options.quiet) {
                console.log('Creating directory ' + thisPath);
            }

            mkdirp.sync(thisPath);
        }
    });
};

methods.getName = function () {
    return this.name;
};

methods.getDirectories = function () {
    return this.directories || [];
};

methods.getDescription = function () {
    return this.description;
};

methods.getLayer = function (name) {
    return this.layers[name];
};

methods.getLayers = function () {
    return this.layers || {};
};

module.exports = Application;
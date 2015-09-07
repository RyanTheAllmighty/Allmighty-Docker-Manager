var docker = require('../docker');

var fs = require('fs');
var _ = require('lodash');
var path = require('path');
var mkdirp = require('mkdirp');

var Component = require('./component');

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

    this.components = {};

    _.forEach(object.components, function (component, key) {
        this.components[key] = new Component(component);
    }, this);
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

methods.getComponent = function (name) {
    return this.components[name];
};

methods.getComponents = function () {
    return this.components || {};
};

module.exports = Application;
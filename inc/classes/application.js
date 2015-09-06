var docker = require('../docker');

var fs = require('fs');
var _ = require('lodash');
var path = require('path');
var mkdirp = require('mkdirp');

var methods = Application.prototype;

function Application(name) {
    if (name instanceof Object) {
        this._spec = name;
    } else {
        this._spec = require(docker.getApplicationJSON(name));
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
    return this._spec.name;
};

methods.getDirectories = function () {
    return this._spec.directories;
};

methods.getDescription = function () {
    return this._spec.description;
};

methods.getComponents = function () {
    return this._spec.components;
};

module.exports = Application;
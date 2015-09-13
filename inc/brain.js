"use strict";

// Require all the external modules
var fs = require('fs');
var _ = require('lodash');
var path = require('path');
var async = require('async');
var Docker = require('dockerode');
var spawn = require('child_process').spawn;

// Noe our applications specific classes
var Link = require('./classes/link');
var Layer = require('./classes/layer');
var Volume = require('./classes/volume');
var Component = require('./classes/component');
var VolumeFrom = require('./classes/volumeFrom');
var Application = require('./classes/application');
var Environment = require('./classes/environment');

// Now require our settings json file
var settings = require('../settings.json');

// Initialize our Docker socket object
var docker = new Docker({socketPath: settings.dockerSocket});

// Now our objects to store our components and applications in
var _components = {};
var _applications = {};

module.exports.docker = docker;

module.exports.settings = settings;

module.exports.load = function () {
    _applications = this.loadApplications();
    _components = this.loadComponents();
};

module.exports.getBaseDirectory = function () {
    return path.join(__dirname, '../');
};

module.exports.getApplications = function () {
    return _applications;
};

module.exports.getApplicationsAsArray = function () {
    return Object.keys(_applications).map(function (key) {
        return _applications[key]
    });
};

module.exports.getApplication = function (name) {
    return _applications[name];
};

module.exports.isApplication = function (name) {
    return name in _applications;
};

module.exports.getComponents = function () {
    return _components;
};

module.exports.getComponentsAsArray = function () {
    return Object.keys(_components).map(function (key) {
        return _components[key]
    });
};

module.exports.getComponent = function (name) {
    return _components[name];
};

module.exports.isComponent = function (name) {
    return name in _components;
};

module.exports.loadComponents = function () {
    var componentNames = fs.readdirSync(this.getBuildsDirectory()).filter(function (file) {
        return fs.statSync(path.join(this.getBuildsDirectory(), file)).isDirectory();
    }, this);

    var components = {};

    _.forEach(componentNames, function (name) {
        components[name] = new Component(name);
    });

    return components;
};

module.exports.loadApplications = function () {
    var applicationNames = _.map(fs.readdirSync(this.getApplicationsDirectory()).filter(function (file) {
        return file.substr(-5) == '.json';
    }), function (app) {
        return app.substr(0, app.length - 5);
    });

    var applications = {};

    _.forEach(applicationNames, function (name) {
        applications[name] = new Application(name);
    });

    return applications;
};

module.exports.getBuildsDirectory = function () {
    return path.resolve(settings.directories.components);
};

module.exports.getApplicationsDirectory = function () {
    return path.resolve(settings.directories.applications);
};


module.exports.getRunningContainerNames = function (callback) {
    docker.listContainers({all: false}, function (err, containers) {
        if (err) {
            return callback(err);
        }

        var names = _.reduceRight(_.map(containers, 'Names'), function (flattened, other) {
            return flattened.concat(other);
        });

        names = _.map(names, function (name) {
            return name.substring(1);
        });

        names = _.filter(names, function (name) {
            return !name.match(/\//g);
        });

        callback(null, names);
    });
};

module.exports.spawnDockerComposeProcess = function (options, dockerArgs, callback) {
    var process = spawn(settings.dockerComposeLocation, dockerArgs);

    process.stdout.on('data', function (data) {
        console.log(data.toString());
    });

    process.stderr.on('data', function (data) {
        console.error(data.toString());
    });

    process.on('close', function (code) {
        if (code != 0) {
            return callback(new Error('Docker Compose returned a non 0 exit code! ' + code + ' was returned!'))
        }

        callback();
    });
};

module.exports.spawnDockerProcess = function (options, dockerArgs, callback) {
    if (!callback) {
        callback = dockerArgs;
        dockerArgs = options;
        options = {};
    }

    var process = spawn(this.settings.dockerLocation, dockerArgs);

    if (!options || !options.quiet) {
        process.stdout.on('data', function (data) {
            console.log(data.toString());
        });

        process.stderr.on('data', function (data) {
            console.error(data.toString());
        });
    }

    process.on('close', function (code) {
        if (code != 0) {
            return callback(new Error('Docker Compose returned a non 0 exit code! ' + code + ' was returned!'))
        }

        callback();
    });
};
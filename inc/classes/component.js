var _ = require('lodash');

var Link = require('./link');
var Volume = require('./volume');
var VolumeFrom = require('./volumeFrom');
var Environment = require('./environment');

var methods = Component.prototype;

function Component(object) {
    for (var propName in object) {
        if (object.hasOwnProperty(propName)) {
            this[propName] = object[propName];
        }
    }

    this.links = [];
    _.forEach(object.links, function (link) {
        this.links.push(new Link(link));
    }, this);

    this.volumes = [];
    _.forEach(object.volumes, function (volume) {
        this.volumes.push(new Volume(volume));
    }, this);

    this.volumesFrom = [];
    _.forEach(object.volumesFrom, function (volume) {
        this.volumesFrom.push(new VolumeFrom(volume));
    }, this);

    this.environment = [];
    _.forEach(object.environment, function (env) {
        this.environment.push(new Environment(env));
    }, this);
}

methods.getImage = function () {
    return this.image;
};

methods.shouldRestart = function () {
    return this.restart;
};

methods.getCommand = function () {
    return this.command;
};

methods.getLinks = function () {
    return this.links;
};

methods.getVolumes = function () {
    return this.volumes;
};

methods.getVolumesFrom = function () {
    return this.volumesFrom;
};

methods.getEnvironment = function () {
    return this.environment;
};

module.exports = Component;
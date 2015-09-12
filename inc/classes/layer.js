"use strict";

var _ = require('lodash');

var Link = require('./link');
var Volume = require('./volume');
var VolumeFrom = require('./volumeFrom');
var Environment = require('./environment');

module.exports = class Component {
    constructor(originalObject) {
        for (var propName in originalObject) {
            if (originalObject.hasOwnProperty(propName)) {
                this[propName] = originalObject[propName];
            }
        }

        this.links = [];
        if (originalObject.links) {
            _.forEach(originalObject.links, function (link) {
                this.links.push(new Link(link));
            }, this);
        }

        this.volumes = [];
        if (originalObject.volumes) {
            _.forEach(originalObject.volumes, function (volume) {
                this.volumes.push(new Volume(volume));
            }, this);
        }

        this.volumesFrom = [];
        if (originalObject.volumesFrom) {
            _.forEach(originalObject.volumesFrom, function (volume) {
                this.volumesFrom.push(new VolumeFrom(volume));
            }, this);
        }

        this.environment = [];
        if (originalObject.environment) {
            _.forEach(originalObject.environment, function (env) {
                this.environment.push(new Environment(env));
            }, this);
        }
    }

    getImage() {
        return this.image;
    }

    isDataOnly() {
        return this.dataOnly;
    }

    shouldRestart() {
        return this.restart;
    }

    getMemoryLimit() {
        return this.memLimit;
    }

    getCommand() {
        return this.command;
    }

    getLinks() {
        return this.links || [];
    }

    getVolumes() {
        return this.volumes || [];
    }

    getVolumesFrom() {
        return this.volumesFrom || [];
    }

    getEnvironment() {
        return this.environment || [];
    }
};
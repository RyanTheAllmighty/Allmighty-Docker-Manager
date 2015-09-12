"use strict";

var _ = require('lodash');

var Link = require('./link');
var Volume = require('./volume');
var VolumeFrom = require('./volumeFrom');
var Environment = require('./environment');

// Symbol for storing the objects properties
var objectSymbol = Symbol();

module.exports = class Component {
    constructor(originalObject) {
        this[objectSymbol] = {};

        for (var propName in originalObject) {
            if (originalObject.hasOwnProperty(propName)) {
                this[objectSymbol][propName] = originalObject[propName];
            }
        }

        this[objectSymbol].links = [];
        if (originalObject.links) {
            _.forEach(originalObject.links, function (link) {
                this[objectSymbol].links.push(new Link(link));
            }, this);
        }

        this[objectSymbol].volumes = [];
        if (originalObject.volumes) {
            _.forEach(originalObject.volumes, function (volume) {
                this[objectSymbol].volumes.push(new Volume(volume));
            }, this);
        }

        this[objectSymbol].volumesFrom = [];
        if (originalObject.volumesFrom) {
            _.forEach(originalObject.volumesFrom, function (volume) {
                this[objectSymbol].volumesFrom.push(new VolumeFrom(volume));
            }, this);
        }

        this[objectSymbol].environment = [];
        if (originalObject.environment) {
            _.forEach(originalObject.environment, function (env) {
                this[objectSymbol].environment.push(new Environment(env));
            }, this);
        }
    }

    get image() {
        return this[objectSymbol].image;
    }

    get dataOnly() {
        return this[objectSymbol].dataOnly;
    }

    get restart() {
        return this[objectSymbol].restart;
    }

    get shouldRestart() {
        return this.restart;
    }

    get memLimit() {
        return this[objectSymbol].memLimit;
    }

    get memoryLimit() {
        return this.memLimit;
    }

    get command() {
        return this[objectSymbol].command;
    }

    get links() {
        return this[objectSymbol].links || [];
    }

    get volumes() {
        return this[objectSymbol].volumes || [];
    }

    get volumesFrom() {
        return this[objectSymbol].volumesFrom || [];
    }

    get environment() {
        return this[objectSymbol].environment || [];
    }
};
"use strict";

// Load the brain in for the application
var brain = require('../brain');

// Symbol for storing the objects properties
var objectSymbol = Symbol();

module.exports = class Volume {
    constructor(originalObject) {
        this[objectSymbol] = {};

        for (var propName in originalObject) {
            if (originalObject.hasOwnProperty(propName)) {
                this[objectSymbol][propName] = originalObject[propName];
            }
        }
    }

    get host() {
        return this[objectSymbol].host;
    }

    get hostMount() {
        return this.host;
    }

    get container() {
        return this[objectSymbol].container;
    }

    get containerMount() {
        return this.container;
    }

    get readOnly() {
        return this[objectSymbol].readOnly === true;
    }
};
"use strict";

// Symbol for storing the objects properties
var objectSymbol = Symbol();

module.exports = class VolumeFrom {
    constructor(originalObject) {
        this[objectSymbol] = {};

        for (var propName in originalObject) {
            if (originalObject.hasOwnProperty(propName)) {
                this[objectSymbol][propName] = originalObject[propName];
            }
        }
    }

    get container() {
        return this[objectSymbol].container;
    }

    get containerName() {
        return this.container;
    }
};
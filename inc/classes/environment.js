"use strict";

// Symbol for storing the objects properties
var objectSymbol = Symbol();

module.exports = class Environment {
    constructor(originalObject) {
        this[objectSymbol] = {};

        for (var propName in originalObject) {
            if (originalObject.hasOwnProperty(propName)) {
                this[objectSymbol][propName] = originalObject[propName];
            }
        }
    }

    get name() {
        return this[objectSymbol].name;
    }

    get value() {
        return this[objectSymbol].value;
    }
};
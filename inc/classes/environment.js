"use strict";

module.exports = class Environment {
    constructor(originalObject) {
        for (var propName in originalObject) {
            if (originalObject.hasOwnProperty(propName)) {
                this[propName] = originalObject[propName];
            }
        }
    }

    getName() {
        return this.name;
    }

    getValue() {
        return this.value;
    }
};
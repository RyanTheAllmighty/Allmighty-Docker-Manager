"use strict";

module.exports = class Link {
    constructor(originalObject) {
        for (var propName in originalObject) {
            if (originalObject.hasOwnProperty(propName)) {
                this[propName] = originalObject[propName];
            }
        }
    }

    getContainer() {
        return this.container;
    }

    getName() {
        return this.name || this.container;
    }
};
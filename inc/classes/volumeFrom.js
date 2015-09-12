"use strict";

module.exports = class VolumeFrom {
    constructor(originalObject) {
        for (var propName in originalObject) {
            if (originalObject.hasOwnProperty(propName)) {
                this[propName] = originalObject[propName];
            }
        }
    }

    getContainerName() {
        return this.container;
    }
};
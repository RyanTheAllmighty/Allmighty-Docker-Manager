"use strict";

module.exports = class Volume {
    constructor(originalObject) {
        for (var propName in originalObject) {
            if (originalObject.hasOwnProperty(propName)) {
                this[propName] = originalObject[propName];
            }
        }
    }

    getHostMount() {
        return this.host;
    }

    getContainerMount() {
        return this.container;
    }

    isReadOnly() {
        return this.readOnly;
    }
};
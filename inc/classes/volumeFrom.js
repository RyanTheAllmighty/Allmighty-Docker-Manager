var methods = VolumeFrom.prototype;

var _ = require('lodash');

function VolumeFrom(object) {
    for (var propName in object) {
        if (object.hasOwnProperty(propName)) {
            this[propName] = object[propName];
        }
    }
}

methods.getContainerName = function () {
    return this.container;
};

module.exports = VolumeFrom;
var _ = require('lodash');

var Volume = require('./volume');

var methods = Component.prototype;

function Component(object) {
    for (var propName in object) {
        if (object.hasOwnProperty(propName)) {
            this[propName] = object[propName];
        }
    }

    this.volumes = {};

    _.forEach(object.volumes, function (volume, key) {
        this.volumes[key] = new Volume(volume);
    }, this);
}

methods.getImage = function () {
    return this.image;
};

methods.shouldRestart = function () {
    return this.restart;
};

methods.getCommand = function () {
    return this.command;
};

methods.getVolumes = function () {
    return this.volumes;
};

module.exports = Component;
var methods = Component.prototype;

var _ = require('lodash');

function Component(object) {
    for (var propName in object) {
        if (object.hasOwnProperty(propName)) {
            this[propName] = object[propName];
        }
    }
}

methods.getImage = function () {
    return this.image;
};

module.exports = Component;
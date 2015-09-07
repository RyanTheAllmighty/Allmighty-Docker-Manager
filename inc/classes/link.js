var methods = Link.prototype;

var _ = require('lodash');

function Link(object) {
    for (var propName in object) {
        if (object.hasOwnProperty(propName)) {
            this[propName] = object[propName];
        }
    }
}

methods.getContainer = function () {
    return this.container;
};

methods.getName = function () {
    if (!this.name) {
        return this.container;
    }

    return this.name;
};

module.exports = Link;
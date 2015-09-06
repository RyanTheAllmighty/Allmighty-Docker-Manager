var methods = Environment.prototype;

var _ = require('lodash');

function Environment(object) {
    for (var propName in object) {
        if (object.hasOwnProperty(propName)) {
            this[propName] = object[propName];
        }
    }
}

methods.getName = function () {
    return this.name;
};

methods.getValue = function () {
    return this.value;
};

module.exports = Environment;
var methods = Volume.prototype;

var _ = require('lodash');

function Volume(object) {
    for (var propName in object) {
        if (object.hasOwnProperty(propName)) {
            this[propName] = object[propName];
        }
    }
}

methods.isReadOnly = function () {
    return this.readOnly;
};

module.exports = Volume;
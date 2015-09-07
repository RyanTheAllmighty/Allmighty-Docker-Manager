var methods = Component.prototype;

var _ = require('lodash');

function Component(name) {
    this.name = name;
}

methods.getName = function () {
    return this.name;
};

module.exports = Component;
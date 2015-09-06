var docker = require('../docker');

var merge = require('merge');

var args;

// The options for this command, if any, and their defaults
var options = {
    quiet: false
};

module.exports.init = function (arguments, callback) {
    args = arguments;
    options = merge(options, args);

    callback();
};

module.exports.run = function (callback) {
    docker.cleanEverything(callback);
};
// Load the brain in for the application
var brain = require('../brain');

var _ = require('lodash');
var async = require('async');
var merge = require('merge');

var args;
var toBuild = [];

// The options for this command, if any, and their defaults
var options = {
    quiet: false,
    noCache: false,
    async: false
};

module.exports.init = function (arguments, callback) {
    args = arguments;
    options = merge(options, args);

    if (args._ && args._.length > 0) {
        var componentName = arguments._.shift();

        if (!brain.isComponent(componentName)) {
            return callback({
                error: 'No component exists called "' + componentName + '"!'
            });
        }

        toBuild.push(brain.getComponent(componentName));
    } else {
        toBuild = toBuild.concat(brain.getComponentsAsArray());
    }

    callback();
};

module.exports.run = function (callback) {
    var _asyncEachCallback = function (component, next) {
        component.build(options, next);
    };

    if (options.async) {
        async.each(toBuild, _asyncEachCallback, callback);
    } else {
        async.eachSeries(toBuild, _asyncEachCallback, callback);
    }
};
/**
 * The push command will push built images to the registry defined in the settings.json file.
 */
"use strict";

var brain = require('../brain');

var async = require('async');
var merge = require('merge');

/**
 * The Component/s we want to push.
 *
 * @type {Component[]}
 */
var toBuild = [];

/**
 * The options for this command along with their defaults.
 *
 * quiet: If there should be no output from the command (default: false)
 * async: If we should push all the components asynchronously (default: false)
 *
 * @type {{quiet: boolean, async: boolean}}
 */
var options = {
    quiet: false,
    async: false
};

/**
 * Initializes this command with the given arguments and does some error checking to make sure we can actually run.
 *
 * @param {Object} passedArgs - An object of arguments
 * @param {App~commandRunCallback} callback - The callback for when we're done
 */
module.exports.init = function (passedArgs, callback) {
    options = merge(options, passedArgs);

    if (passedArgs._ && passedArgs._.length > 0) {
        let componentName = passedArgs._[0];

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

/**
 * This runs the command with the given arguments/options set in the init method and returns possibly an error and
 * response in the callback if any.
 *
 * @param {App~commandRunCallback} callback - The callback for when we're done
 */
module.exports.run = function (callback) {
    let _asyncEachCallback = function (component, next) {
        component.push(options, next);
    };

    if (options.async) {
        async.each(toBuild, _asyncEachCallback, callback);
    } else {
        async.eachSeries(toBuild, _asyncEachCallback, callback);
    }
};
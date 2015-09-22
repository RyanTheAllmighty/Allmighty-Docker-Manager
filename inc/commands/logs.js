/*
 * Allmighty Docker Manager - https://github.com/RyanTheAllmighty/Allmighty-Docker-Manager
 * Copyright (C) 2015 RyanTheAllmighty
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

/**
 * The logs command will get the logs for a layer in an application.
 *
 * The first argument should be the applications name and the second argument should be the layers name.
 */
"use strict";

var brain = require('../brain');

var async = require('async');
var merge = require('merge');

/**
 * The Layer we want to get the logs for.
 *
 * @type {Layer}
 */
var layer;

/**
 * The options for this command along with their defaults.
 *
 * l: The number of lines of logs to get (default: 50)
 *
 * @type {{l: Number}}
 */
var options = {
    l: 50
};

/**
 * Initializes this command with the given arguments and does some error checking to make sure we can actually run.
 *
 * @param {Object} passedArgs - An object of arguments
 * @param {App~commandRunCallback} callback - The callback for when we're done
 */
module.exports.init = function (passedArgs, callback) {
    options = merge(options, passedArgs);

    if (!passedArgs._ || passedArgs._.length < 2) {
        return callback(new Error('2 arguments must be passed in!'));
    }

    if (passedArgs.l <= 0) {
        return callback(new Error('The n option must be a number more than 0!'));
    }

    let applicationName = passedArgs._[0];
    let layerName = passedArgs._[1];

    brain.isApplication(applicationName, function (isApp) {
        if (!isApp) {
            return callback(new Error('No application with the name of ' + applicationName + ' exists!'));
        }

        let application = brain.getApplication(applicationName);

        application.isLayer(layerName, function (isLayer) {
            if (!isLayer) {
                return callback(new Error('No layer with the name of ' + layerName + ' exists for the application ' + applicationName + '!'));
            }

            layer = application.getLayer(layerName);

            layer.isUp(function (isUp) {
                if (!isUp) {
                    return callback(new Error('That layer is not up! Please start it before trying to get the logs from it!'));
                }

                callback();
            });
        });
    });
};

/**
 * This runs the command with the given arguments/options set in the init method and returns possibly an error and
 * response in the callback if any.
 *
 * @param {App~commandRunCallback} callback - The callback for when we're done
 */
module.exports.run = function (callback) {
    layer.container.logs({
        stdout: true,
        stderr: true,
        timestamps: true,
        tail: options.l
    }, function (err, stream) {
        if (err) {
            return callback(err);
        }

        layer.container.modem.demuxStream(stream, process.stdout, process.stderr);
    });
};
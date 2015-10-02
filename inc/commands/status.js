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
 * The status command gets the status of all layers for all applications and checks if they are online or not.
 */
"use strict";

var brain = require('../brain');

var _ = require('lodash');
var async = require('async');
var merge = require('merge');
let colours = require('colors');
var sprintf = require("sprintf-js").sprintf;

/**
 * The options for this command along with their defaults.
 *
 * @type {Object}
 */
var options = {};

/**
 * Initializes this command with the given arguments and does some error checking to make sure we can actually run.
 *
 * @param {Object} passedArgs - An object of arguments
 * @param {App~commandRunCallback} callback - The callback for when we're done
 */
module.exports.init = function (passedArgs, callback) {
    callback();
};

/**
 * This runs the command with the given arguments/options set in the init method and returns possibly an error and
 * response in the callback if any.
 *
 * @param {App~commandRunCallback} callback - The callback for when we're done
 */
module.exports.run = function (callback) {
    let first = true;

    async.eachSeries(brain.getApplicationsAsArray(), function (application, next) {
        if (first) {
            first = false;
        } else {
            brain.logger.line();
        }

        brain.logger.raw(application.applicationName.cyan);
        brain.logger.line();

        async.eachSeries(application.getLayersAsArray(), function (layer, nextt) {
            if (!layer.dataOnly && !layer.runOnly) {
                brain.logger.raw(sprintf('%15s: ', layer.name));
                layer.isUp(function (isUp) {
                    brain.logger.raw(isUp ? 'Online'.green : 'Offline'.red);
                    brain.logger.line();

                    nextt();
                });
            } else {
                nextt();
            }
        }, function (err) {
            next();
        });
    }, callback);

};
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
 * The clean command will remove all local containers and images.
 */
"use strict";

var brain = require('../brain');

var async = require('async');
var merge = require('merge');

/**
 * The options for this command along with their defaults.
 *
 * quiet: If there should be no output from the command (default: false)
 * containers: If all containers should be cleaned up (default: false)
 * images: If all images should be cleaned up (default: false)
 *
 * @type {{quiet: boolean, containers: boolean, images: boolean}}
 */
var options = {
    quiet: false,
    containers: false,
    images: false
};

/**
 * Initializes this command with the given arguments and does some error checking to make sure we can actually run.
 *
 * @param {Object} passedArgs - An object of arguments
 * @param {App~commandRunCallback} callback - The callback for when we're done
 */
module.exports.init = function (passedArgs, callback) {
    options = merge(options, passedArgs);

    if (!options.containers && !options.images) {
        return callback(new Error('You must specify if you want to clean containers, images or both with the --containers and --images flags!'));
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
    brain.docker.listContainers({all: true}, function (err, containers) {
        if (err) {
            return callback(err);
        }

        if (options.containers) {
            brain.logger.info('Deleting all containers!');

            async.each(containers, function (containerInfo, next) {
                brain.docker.getContainer(containerInfo.Id).stop(function (err) {
                    if (err && err.statusCode != 304) {
                        return next(err);
                    }

                    brain.docker.getContainer(containerInfo.Id).remove(next);
                });
            }, callback);
        }

        if (options.images) {
            brain.docker.listImages(function (err, images) {
                if (err) {
                    return callback(err);
                }

                brain.logger.info('Deleting all images!');

                async.each(images, function (imageInfo, next) {
                    brain.docker.getImage(imageInfo.Id).remove(next);
                }, callback);
            });
        }
    });
};
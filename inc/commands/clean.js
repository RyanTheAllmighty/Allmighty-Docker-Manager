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
 *
 * @type {{quiet: boolean}}
 */
var options = {
    quiet: false
};

/**
 * Initializes this command with the given arguments and does some error checking to make sure we can actually run.
 *
 * @param {Object} passedArgs - An object of arguments
 * @param {App~commandRunCallback} callback - The callback for when we're done
 */
module.exports.init = function (passedArgs, callback) {
    options = merge(options, passedArgs);

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

        console.log('Deleting all containers!');

        async.each(containers, function (containerInfo, next) {
            brain.docker.getContainer(containerInfo.Id).stop(function (err) {
                if (err && err.statusCode != 304) {
                    return next(err);
                }

                brain.docker.getContainer(containerInfo.Id).remove(next);
            });
        }, function (err) {
            if (err) {
                return callback(err);
            }

            brain.docker.listImages(function (err, images) {
                if (err) {
                    return callback(err);
                }

                console.log('Deleting all images!');

                async.each(images, function (imageInfo, next) {
                    brain.docker.getImage(imageInfo.Id).remove(next);
                }, function (err) {
                    if (err) {
                        return callback(err);
                    }

                    callback();
                });
            });
        });
    });
};
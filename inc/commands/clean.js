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

(function () {
    'use strict';

    let brain = require('../brain');

    let async = require('async');
    let merge = require('merge');

    /**
     * The options for this command along with their defaults.
     *
     * quiet: If there should be no output from the command (default: false)
     * containers: If all containers should be cleaned up (default: false)
     * images: If all images should be cleaned up (default: false)
     * untagged: If we should only removed untagged images (default: false)
     * force: If the cleaning should be forced or not (default: false)
     *
     * @type {{quiet: boolean, containers: boolean, images: boolean, force: boolean}}
     */
    let options = {
        quiet: false,
        containers: false,
        images: false,
        untagged: false,
        force: false
    };

    /**
     * Initializes this command with the given arguments and does some error checking to make sure we can actually run.
     *
     * @param {Object} passedArgs - An object of arguments
     * @returns {Promise}
     */
    module.exports.init = function (passedArgs) {
        return new Promise(function (resolve, reject) {
            options = merge(options, passedArgs);

            if (!options.containers && !options.images) {
                return reject(new Error('You must specify if you want to clean containers, images or both with the --containers and --images flags!'));
            }

            resolve();
        });
    };

    /**
     * This runs the command with the given arguments/options set in the init method and returns a promise which will be rejected with an error or resolved.
     *
     * @returns {Promise}
     */
    module.exports.run = function () {
        return new Promise(function (resolve, reject) {
            brain.docker.listContainers({all: true}, function (err, containers) {
                if (err) {
                    return reject(err);
                }

                if (options.containers) {
                    brain.logger.info('Deleting all containers!');

                    async.each(containers, function (containerInfo, next) {
                        brain.docker.getContainer(containerInfo.Id).stop({force: options.force}, function (err) {
                            if (err && err.statusCode !== 304) {
                                return next(err);
                            }

                            brain.docker.getContainer(containerInfo.Id).remove({force: options.force}, next);
                        });
                    }, (err) => err ? reject(err) : resolve());
                }

                if (options.images) {
                    brain.docker.listImages(function (err, images) {
                        if (err) {
                            return reject(err);
                        }

                        brain.logger.info('Deleting all ' + (options.untagged ? 'untagged ' : '') + 'images!');

                        async.each(images, function (imageInfo, next) {
                            let image = brain.docker.getImage(imageInfo.Id);

                            if (options.untagged) {
                                image.inspect(function (err, data) {
                                    if (err || data.RepoTags.length === 0) {
                                        image.remove({force: options.force}, next);
                                    }
                                });
                            } else {
                                image.remove({force: options.force}, next);
                            }
                        }, (err) => err ? reject(err) : resolve());
                    });
                }
            });
        });
    };
})();
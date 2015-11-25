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
 * The monitor command will run a container which will show the stats for all the Docker containers currently running
 * on the system.
 */

(function () {
    'use strict';

    let brain = require('../brain');

    let merge = require('merge');

    /**
     * The options for this command along with their defaults.
     *
     * quiet: If there should be no output from the command (default: false)
     * port: The port to run the web UI on (default: 8080)
     *
     * @type {{quiet: boolean, port: number}}
     */
    let options = {
        quiet: false,
        port: 8080
    };

    /**
     * Initializes this command with the given arguments and does some error checking to make sure we can actually run.
     *
     * @param {Object} passedArgs - An object of arguments
     * @param {App~commandRunCallback} callback - The callback for when we're done
     */
    module.exports.init = function (passedArgs, callback) {
        options = merge(options, passedArgs);

        brain.getRunningContainerNames(function (err, containers) {
            if (err) {
                return callback(err);
            }

            if (containers.length === 0) {
                return callback(new Error('There are no containers currently running!'));
            }

            callback();
        });
    };

    /**
     * This runs the command with the given arguments/options set in the init method and returns possibly an error and
     * response in the callback if any.
     *
     * @param {App~commandRunCallback} callback - The callback for when we're done
     */
    module.exports.run = function (callback) {
        let dockerOptions = {
            AttachStdin: true,
            AttachStdout: true,
            AttachStderr: true,
            Tty: true,
            OpenStdin: true,
            StdinOnce: false,
            Dns: ['8.8.8.8', '8.8.4.4'],
            Image: 'google/cadvisor:latest',
            Binds: [
                '/:/rootfs:ro',
                '/var/run:/var/run:rw',
                '/sys:/sys:ro',
                '/var/lib/docker/:/var/lib/docker:ro'
            ],
            PortBindings: {
                '8080/tcp': [
                    {
                        HostPort: options.port.toString()
                    }
                ]
            },
            name: 'cadvisor'
        };

        brain.logger.info('Pulling down latest cAdvisor image!');

        brain.docker.pull('google/cadvisor:latest', function (err, stream) {
            if (err) {
                return callback(err);
            }

            brain.docker.modem.followProgress(stream, onFinished, onProgress);

            function onFinished() {
                brain.logger.info('Running monitoring now. Access the web UI via port ' + options.port + '!');
                
                brain.run(dockerOptions, function (err) {
                    brain.logger.info('The monitoring has stopped and is no longer available!');
                    callback(err);
                });
            }

            function onProgress(progress) {
                if (!options.quiet && progress.stream) {
                    process.stdout.write(progress.stream);
                }
            }
        });
    };
})();
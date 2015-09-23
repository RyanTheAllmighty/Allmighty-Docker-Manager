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

"use strict";

let brain = require('../brain');

let Link = require('./link');
let Port = require('./port');
let Volume = require('./volume');
let VolumeFrom = require('./volumeFrom');
let Environment = require('./environment');

let _ = require('lodash');
let bytes = require('bytes');
let sprintf = require("sprintf-js").sprintf;

// Symbol for storing the objects properties
let objectSymbol = Symbol();

module.exports = class Layer {
    /**
     * Constructor to create a new layer.
     *
     * @param {Application} application - the application instance this layer belongs to
     * @param {String} name - the name of this layer
     * @param {Object} originalObject - the object passed in which represents this layer. Parsed from json
     */
    constructor(application, name, originalObject) {
        this[objectSymbol] = {};

        this[objectSymbol]._application = application;
        this[objectSymbol].name = name;

        // Copy over the original objects properties to this objects private Symbol
        for (let propName in originalObject) {
            if (originalObject.hasOwnProperty(propName)) {
                this[objectSymbol][propName] = originalObject[propName];
            }
        }

        // Turn the ports in the object into Port objects
        this[objectSymbol].ports = [];
        if (originalObject.ports) {
            _.forEach(originalObject.ports, function (port) {
                this[objectSymbol].ports.push(new Port(port));
            }, this);
        }

        // Turn the links in the object into Link objects
        this[objectSymbol].links = [];
        if (originalObject.links) {
            _.forEach(originalObject.links, function (link) {
                this[objectSymbol].links.push(new Link(link));
            }, this);
        }

        // Turn the volumes in the object into Volume objects
        this[objectSymbol].volumes = [];
        if (originalObject.volumes) {
            _.forEach(originalObject.volumes, function (volume) {
                this[objectSymbol].volumes.push(new Volume(volume));
            }, this);
        }

        // Turn the volumes from in the object into VolumeFrom objects
        this[objectSymbol].volumesFrom = [];
        if (originalObject.volumesFrom) {
            _.forEach(originalObject.volumesFrom, function (volume) {
                this[objectSymbol].volumesFrom.push(new VolumeFrom(volume));
            }, this);
        }

        // Tuen the envionrment variables in the object into Environment objects
        this[objectSymbol].environment = [];
        if (originalObject.environment) {
            _.forEach(originalObject.environment, function (env) {
                this[objectSymbol].environment.push(new Environment(env));
            }, this);
        }
    }

    /**
     * Gets the application object that this layer belongs to.
     *
     * @returns {Application}
     */
    get application() {
        return this[objectSymbol]._application;
    }

    /**
     * Gets the command to run for this layer, if any.
     *
     * @returns {String[]}
     */
    get command() {
        if (!this[objectSymbol].command) {
            return [];
        } else if (!(this[objectSymbol].command instanceof Array)) {
            return [this[objectSymbol].command];
        } else {
            return this[objectSymbol].command;
        }
    }

    /**
     * Gets the container object for this layer.
     *
     * @returns {Container}
     */
    get container() {
        return brain.docker.getContainer(this.containerName);
    }

    /**
     * Gets this layers name which is given to the container it creates.
     *
     * This takes the form of [application name]_[name].
     *
     * @returns {String}
     */
    get containerName() {
        return sprintf('%s_%s', this.application.applicationName, this.name);
    }

    /**
     * Returns if this layer is a data only layer which means it only holds data and shouldn't be started up.
     *
     * @returns {Boolean}
     */
    get dataOnly() {
        return this[objectSymbol].dataOnly || false;
    }

    /**
     * Gets the options that are passed to Docker to start up this layer.
     *
     * @returns {Object}
     */
    get dockerOptions() {
        let self = this;

        let dockerOptions = {
            AttachStdin: false,
            AttachStdout: false,
            AttachStderr: false,
            Tty: false,
            OpenStdin: false,
            Cmd: this.command,
            Dns: brain.settings.dns,
            Image: this.image,
            Env: null,
            name: this.containerName,
            HostConfig: {}
        };

        if (this.shouldRestart) {
            dockerOptions.HostConfig.RestartPolicy = {"Name": "always"};
        }

        if (this.links && this.links.length > 0) {
            dockerOptions.HostConfig.Links = [];

            this.links.forEach(function (link) {
                dockerOptions.HostConfig.Links.push(sprintf('%s:%s', sprintf('%s_%s', self.application.applicationName, link.container), link.name));
            });
        }

        if (this.ports && this.ports.length > 0) {
            dockerOptions.ExposedPorts = {};
            dockerOptions.HostConfig.PortBindings = {};

            this.ports.forEach(function (port) {
                dockerOptions.ExposedPorts[sprintf('%d/tcp', port.container)] = {};
                dockerOptions.ExposedPorts[sprintf('%d/udp', port.container)] = {};

                dockerOptions.HostConfig.PortBindings[sprintf('%d/tcp', port.container)] = [{HostPort: port.host.toString()}];
                dockerOptions.HostConfig.PortBindings[sprintf('%d/udp', port.container)] = [{HostPort: port.host.toString()}];
            });
        }

        if (this.environment && this.environment.length > 0) {
            dockerOptions.Env = [];

            this.environment.forEach(function (env) {
                dockerOptions.Env.push(sprintf('%s=%s', env.name, env.value));
            });
        }

        if (this.volumes && this.volumes.length > 0) {
            dockerOptions.Volumes = {};
            dockerOptions.HostConfig.Binds = [];

            this.volumes.forEach(function (volume) {
                dockerOptions.Volumes[volume.container] = {};
                dockerOptions.HostConfig.Binds.push(sprintf('%s:%s', volume.host, volume.container) + (volume.readOnly ? ':ro' : ''));
            });
        }

        if (this.volumesFrom && this.volumesFrom.length > 0) {
            dockerOptions.HostConfig.VolumesFrom = [];

            this.volumesFrom.forEach(function (container) {
                dockerOptions.HostConfig.VolumesFrom.push(sprintf('%s_%s', self.application.applicationName, container.container));
            });
        }

        if (this.memLimit) {
            dockerOptions.HostConfig.Memory = bytes(this.memLimit);
        }

        return dockerOptions;
    }

    /**
     * Gets the environment variables for this layer.
     *
     * @returns {Environment[]}
     */
    get environment() {
        return this[objectSymbol].environment || [];
    }

    /**
     * Gets the name of the image used by this layer. If no tag name/version is provided then it will default to 'latest'.
     *
     * @returns {String}
     */
    get image() {
        let imageToGet = this[objectSymbol].image;

        let fromCustomRepo = imageToGet.indexOf(brain.settings.repositoryAuth.serveraddress) > -1;
        let hasVersion = fromCustomRepo ? (brain.settings.repositoryAuth.serveraddress.indexOf(':') == -1 ? imageToGet.indexOf(':') > -1 : brain.settings.repositoryAuth.serveraddress.indexOf(':') == imageToGet.indexOf(':')) : imageToGet.indexOf(':') > -1;

        return hasVersion ? imageToGet : imageToGet + ':latest';
    }

    /**
     * Gets the links for this layer that are required to start up and link with other layers.
     *
     * @returns {Link[]}
     */
    get links() {
        return this[objectSymbol].links || [];
    }

    /**
     * Gets the memory limit for this layer in the format of #MB/#GB.
     *
     * @returns {String|undefined}
     */
    get memLimit() {
        return this[objectSymbol].memLimit;
    }

    /**
     * Gets the name of this layer.
     *
     * @returns {String}
     */
    get name() {
        return this[objectSymbol].name;
    }

    /**
     * Gets the ports to expose from this layer.
     *
     * @returns {Port[]}
     */
    get ports() {
        return this[objectSymbol].ports;
    }

    /**
     * Gets if this layer should restart when it goes offline.
     *
     * @returns {Boolean}
     */
    get shouldRestart() {
        return this[objectSymbol].restart;
    }

    /**
     * Gets the volumes for this layer.
     *
     * @returns {Volume[]}
     */
    get volumes() {
        return this[objectSymbol].volumes || [];
    }

    /**
     * Gets the volumes for this layer that come from other layers.
     *
     * @returns {VolumeFrom[]}
     */
    get volumesFrom() {
        return this[objectSymbol].volumesFrom || [];
    }

    /**
     * Brings this layer down.
     *
     * @param {Object} options - options passed in from the user
     * @param {Layer~downCallback} callback - the callback for when we're done
     */
    down(options, callback) {
        let self = this;

        this.isUp(function (isUp) {
            if (!isUp) {
                return callback();
            }

            self.container.stop(function (err) {
                if (err) {
                    return callback(err);
                }

                console.log(self.containerName + ' is now down!');

                if (options.rm) {
                    self.container.remove(callback);
                } else {
                    callback();
                }
            });
        });
    }

    /**
     * Checks to see if this layer is up.
     *
     * @param {Layer~isUpCallback} callback - the callback for when we're done
     */
    isUp(callback) {
        this.container.inspect(function (err, data) {
            // If there is an error returned then the container hasn't been created
            if (err) {
                return callback(false);
            }

            // Else it has been created so we check if it's running based on what the inspect command tells us
            callback(data.State.Running || false);
        });
    }

    /**
     * Pulls the image needed for this layer.
     *
     * @param {Object} options - options passed in from the user
     * @param {Layer~pullCallback} callback - the callback for when we're done
     */
    pull(options, callback) {
        let fromCustomRepo = this.image.indexOf(brain.settings.repositoryAuth.serveraddress) > -1;
        let hasVersion = fromCustomRepo ? (brain.settings.repositoryAuth.serveraddress.indexOf(':') == -1 ? this.image.indexOf(':') > -1 : brain.settings.repositoryAuth.serveraddress.indexOf(':') == this.image.indexOf(':')) : this.image.indexOf(':') > -1;

        if (fromCustomRepo && !brain.settings.repositoryAuth) {
            return callback(new Error('No repository auth is set in the settings.json file!'));
        }

        console.log('Started pull for ' + this.name + ' (' + this.image + ')');

        let pullOpts = fromCustomRepo ? brain.settings.repositoryAuth : {};

        let self = this;

        brain.docker.pull(this.image, pullOpts, function (err, stream) {
            if (err || stream === null) {
                console.log('Error pulling ' + self.name + ' (' + self.image + ')');
                return callback(err);
            }

            brain.docker.modem.followProgress(stream, function (err, output) {
                console.log('Finished pull for ' + self.name + ' (' + self.image + ')');
                callback(err, output);
            });
        });
    }

    /**
     * Restarts this layer.
     *
     * @param {Object} options - options passed in from the user
     * @param {Layer~restartCallback} callback - the callback for when we're done
     */
    restart(options, callback) {
        let self = this;

        this.isUp(function (isUp) {
            if (!isUp) {
                self.up(callback);
            }

            console.log(self.containerName + ' is being restarted!');

            self.container.restart(function (err) {
                if (err) {
                    return callback(err);
                }

                console.log(self.containerName + ' has been restarted!');
                callback();
            });
        });
    }

    /**
     * This brings this layer up if it needs to be brought up.
     *
     * @param {Object} options - options passed in from the user
     * @param {Layer~upCallback} callback - the callback for when we're done
     */
    up(options, callback) {
        let self = this;

        console.log(self.containerName + ' is starting up!');

        this.isUp(function (isUp) {
            if (isUp) {
                // This layer is already up, so there is no need to bring it up again
                return callback();
            }

            let bringUp = function () {
                self.container.remove(function () {
                    brain.docker.createContainer(self.dockerOptions, function (err, container) {
                        if (err) {
                            return callback(err);
                        }

                        // This is a data only container, so we don't need to run it
                        if (self.dataOnly) {
                            console.log(self.containerName + ' data container has been created!');
                            return callback();
                        }

                        container.start(function (err, d) {
                            if (err) {
                                return callback(err);
                            }

                            console.log(self.containerName + ' is now up!');

                            callback();
                        });
                    });
                });
            };

            let pullAndUp = function () {
                self.pull(options, function (err) {
                    if (err) {
                        return callback(err);
                    }

                    bringUp();
                });
            };

            // Pull the layers image so we make sure we're up to date
            if (!options.pull) {
                brain.docker.getImage(self.image).get(function (err) {
                    if (err) {
                        pullAndUp();
                    } else {
                        bringUp();
                    }
                });
            } else {
                pullAndUp();
            }
        });
    }
};

/**
 * This is the callback used when bringing a layer down.
 *
 * @callback Layer~downCallback
 * @param {Error|undefined} err - the error (if any) that occurred while trying to bring this layer down
 */

/**
 * This is the callback used when checking to see if a layer is up or not.
 *
 * @callback Layer~isUpCallback
 * @param {Boolean} up - if this layer is up or not
 */

/**
 * This is the callback used when pulling the image for a layer.
 *
 * @callback Layer~pullCallback
 * @param {Error|undefined} err - the error (if any) that occurred while trying to pull the image for this layer
 */

/**
 * This is the callback used when restarting a layer.
 *
 * @callback Layer~restartCallback
 * @param {Error|undefined} err - the error (if any) that occurred while trying to restart this layer
 */

/**
 * This is the callback used when we attempt to bring a layer up.
 *
 * @callback Layer~upCallback
 * @param {Error|undefined} err - the error (if any) that occurred while trying to bring this layer up
 */
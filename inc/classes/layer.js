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

var _ = require('lodash');

// Load the brain in for the application
var brain = require('../brain');

var Link = require('./link');
var Port = require('./port');
var Volume = require('./volume');
var VolumeFrom = require('./volumeFrom');
var Environment = require('./environment');

var bytes = require('bytes');
var sprintf = require("sprintf-js").sprintf;

// Symbol for storing the objects properties
var objectSymbol = Symbol();

module.exports = class Layer {
    constructor(application, name, originalObject) {
        this[objectSymbol] = {};

        this[objectSymbol]._application = application;
        this[objectSymbol].name = name;

        for (var propName in originalObject) {
            if (originalObject.hasOwnProperty(propName)) {
                this[objectSymbol][propName] = originalObject[propName];
            }
        }

        this[objectSymbol].ports = [];
        if (originalObject.ports) {
            _.forEach(originalObject.ports, function (port) {
                this[objectSymbol].ports.push(new Port(port));
            }, this);
        }

        this[objectSymbol].links = [];
        if (originalObject.links) {
            _.forEach(originalObject.links, function (link) {
                this[objectSymbol].links.push(new Link(link));
            }, this);
        }

        this[objectSymbol].volumes = [];
        if (originalObject.volumes) {
            _.forEach(originalObject.volumes, function (volume) {
                this[objectSymbol].volumes.push(new Volume(volume));
            }, this);
        }

        this[objectSymbol].volumesFrom = [];
        if (originalObject.volumesFrom) {
            _.forEach(originalObject.volumesFrom, function (volume) {
                this[objectSymbol].volumesFrom.push(new VolumeFrom(volume));
            }, this);
        }

        this[objectSymbol].environment = [];
        if (originalObject.environment) {
            _.forEach(originalObject.environment, function (env) {
                this[objectSymbol].environment.push(new Environment(env));
            }, this);
        }
    }

    get application() {
        return this[objectSymbol]._application;
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
     * Checks to see if this layer is up.
     *
     * @param callback - a callback which returns a boolean of if this layer is up or not
     */
    isUp(callback) {
        this.container.inspect(function (err, data) {
            if (err) {
                return callback(false);
            }

            callback(data.State.Running || false);
        });
    }

    /**
     * This brings this layer up if it needs to be brought up.
     *
     * @param {Array} options - array of options passed in from the user
     * @param callback - the callback to run when an error occurs or things are done successfully
     */
    up(options, callback) {
        var self = this;

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

    restart(options, callback) {
        let self = this;

        this.isUp(function (isUp) {
            if (!isUp) {
                return callback();
            }

            console.log(self.containerName + ' is being restarted!');

            self.container.restart(function (err) {
                if (err) {
                    return callback(err);
                }

                console.log(self.containerName + ' has been restarted!');

                if (options.rm) {
                    self.container.remove(callback);
                } else {
                    callback();
                }
            });
        });
    }

    get container() {
        return brain.docker.getContainer(this.containerName);
    }

    get name() {
        return this[objectSymbol].name;
    }

    get ports() {
        return this[objectSymbol].ports;
    }

    get image() {
        let imageToGet = this[objectSymbol].image;

        let fromCustomRepo = imageToGet.indexOf(brain.settings.repositoryAuth.serveraddress) > -1;
        let hasVersion = fromCustomRepo ? (brain.settings.repositoryAuth.serveraddress.indexOf(':') == -1 ? imageToGet.indexOf(':') > -1 : brain.settings.repositoryAuth.serveraddress.indexOf(':') == imageToGet.indexOf(':')) : imageToGet.indexOf(':') > -1;

        return hasVersion ? imageToGet : imageToGet + ':latest';
    }

    get dataOnly() {
        return this[objectSymbol].dataOnly;
    }

    get shouldRestart() {
        return this[objectSymbol].restart;
    }

    get memLimit() {
        return this[objectSymbol].memLimit;
    }

    get memoryLimit() {
        return this.memLimit;
    }

    get command() {
        if (!this[objectSymbol].command) {
            return [];
        } else if (!(this[objectSymbol].command instanceof Array)) {
            return [this[objectSymbol].command];
        } else {
            return this[objectSymbol].command;
        }
    }

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

    get links() {
        return this[objectSymbol].links || [];
    }

    get volumes() {
        return this[objectSymbol].volumes || [];
    }

    get volumesFrom() {
        return this[objectSymbol].volumesFrom || [];
    }

    get environment() {
        return this[objectSymbol].environment || [];
    }

    pull(options, callback) {
        let fromCustomRepo = this.image.indexOf(brain.settings.repositoryAuth.serveraddress) > -1;
        let hasVersion = fromCustomRepo ? (brain.settings.repositoryAuth.serveraddress.indexOf(':') == -1 ? this.image.indexOf(':') > -1 : brain.settings.repositoryAuth.serveraddress.indexOf(':') == this.image.indexOf(':')) : this.image.indexOf(':') > -1;

        if (fromCustomRepo && !brain.settings.repositoryAuth) {
            return callback(new Error('No repository auth is set in the settings.json file!'));
        }

        console.log('Started pull for ' + this.name + ' (' + this.image + ')');

        let pullOpts = fromCustomRepo ? brain.settings.repositoryAuth : {};

        var self = this;

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
};
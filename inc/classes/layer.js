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

(function () {
    'use strict';

    let brain = require('../brain');

    let Link = require('./link');
    let Port = require('./port');
    let Label = require('./label');
    let Volume = require('./volume');
    let RunAfter = require('./runAfter');
    let VolumeFrom = require('./volumeFrom');
    let Environment = require('./environment');

    let fs = require('fs');
    let _ = require('lodash');
    let path = require('path');
    let async = require('async');
    let bytes = require('bytes');
    let touch = require('touch');
    let mkdirp = require('mkdirp');
    let sprintf = require('sprintf-js').sprintf;

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

            // Turn the labels in the object into Label objects
            this[objectSymbol].labels = [];
            if (originalObject.labels) {
                _.forEach(originalObject.labels, function (label) {
                    this[objectSymbol].labels.push(new Label(label));
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
                    this[objectSymbol].volumes.push(new Volume(this, volume));
                }, this);
            }

            // Turn the runAfters from in the object into RunAfter objects
            this[objectSymbol].runAfter = [];
            if (originalObject.runAfter) {
                _.forEach(originalObject.runAfter, function (runAfter) {
                    this[objectSymbol].runAfter.push(new RunAfter(this, runAfter));
                }, this);
            }

            // Turn the volumes from in the object into VolumeFrom objects
            this[objectSymbol].volumesFrom = [];
            if (originalObject.volumesFrom) {
                _.forEach(originalObject.volumesFrom, function (volumeFrom) {
                    this[objectSymbol].volumesFrom.push(new VolumeFrom(volumeFrom));
                }, this);
            }

            // Turn the environment variables in the object into Environment objects
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
         * Gets the number of CPU shares for this layer. Defaults to 1024.
         *
         * @returns {Number}
         */
        get cpuShares() {
            return this[objectSymbol].cpuShares || 1024;
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
         * Gets an array of the layers that this layer depends on being online/created before this layer can be started.
         *
         * @returns {String[]}
         */
        get dependentLayers() {
            let layers = [];

            if (this.links.length > 0) {
                // There is one or more links, so we need to figure out what we need to startup before this layer
                _.forEach(this.links, function (link) {
                    layers.push(link.container);
                });
            }

            if (this.volumesFrom.length > 0) {
                // There is one or more volumesFrom, so we need to figure out what we need to startup before this layer
                _.forEach(this.volumesFrom, function (volumeFrom) {
                    layers.push(volumeFrom.container);
                });
            }

            return layers;
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
                Labels: {},
                name: this.containerName,
                HostConfig: {
                    LxcConf: [],
                    Devices: [],
                    MemorySwappiness: -1
                }
            };

            if (this.shouldRestart) {
                dockerOptions.HostConfig.RestartPolicy = {Name: 'always'};
            }

            if (this.labels && this.labels.length > 0) {
                this.labels.forEach(function (label) {
                    dockerOptions.Labels[label.name] = label.value;
                });
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
                    if (port.tcp) {
                        dockerOptions.ExposedPorts[sprintf('%d/tcp', port.container)] = {};
                        dockerOptions.HostConfig.PortBindings[sprintf('%d/tcp', port.container)] = [{HostPort: port.host.toString()}];
                    }

                    if (port.udp) {
                        dockerOptions.ExposedPorts[sprintf('%d/udp', port.container)] = {};
                        dockerOptions.HostConfig.PortBindings[sprintf('%d/udp', port.container)] = [{HostPort: port.host.toString()}];
                    }
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
                    if (!fs.existsSync(volume.host)) {
                        if (!volume.directory || path.basename(volume.host).indexOf('.') !== -1) {
                            touch.sync(volume.host);
                        } else {
                            mkdirp.sync(volume.host);
                        }
                    }

                    // If it exists on the host and is a directory then we add it to the Volumes, files shouldn't be added there
                    if (fs.existsSync(volume.host) && fs.statSync(volume.host).isDirectory()) {
                        dockerOptions.Volumes[volume.container] = {};
                    }

                    dockerOptions.HostConfig.Binds.push(sprintf('%s:%s', volume.host, volume.container) + (volume.readOnly ? ':ro' : ':rw'));
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

            if (this.cpuShares) {
                dockerOptions.HostConfig.CpuShares = this.cpuShares;
            }

            if (this.workingDirectory) {
                dockerOptions.WorkingDir = this.workingDirectory;
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

            let address = brain.settings.repositoryAuth.serveraddress;

            if (address.indexOf('://') !== -1) {
                address = address.substr(address.indexOf('://') + 3, address.length);
            }

            if (imageToGet.indexOf('${repositoryURL}') !== -1) {
                let replacement = (address.substr(-1) === '/' ? address.substr(0, address.length - 1) : address);

                if (!brain.settings.repositoryAuth.serveraddress || brain.settings.repositoryAuth.serveraddress.indexOf('https://index.docker.io') === 0) {
                    replacement = brain.settings.repositoryAuth.username;
                }

                imageToGet = imageToGet.replace('${repositoryURL}', replacement);
            }

            let fromCustomRepo = imageToGet.indexOf(address) > -1;
            let hasVersion = fromCustomRepo ? (address.indexOf(':') === -1 ? imageToGet.indexOf(':') > -1 : address.indexOf(':') !== imageToGet.lastIndexOf(':')) : imageToGet.indexOf(':') > -1;

            return hasVersion ? imageToGet : imageToGet + ':latest';
        }

        /**
         * Gets the labels for this layer.
         *
         * @returns {Label[]}
         */
        get labels() {
            return this[objectSymbol].labels || [];
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
         * Gets the things to run after this layer is finished (runOnly layers only).
         *
         * @returns {RunAfter[]}
         */
        get runAfter() {
            return this[objectSymbol].runAfter;
        }

        /**
         * Returns if this layer is a run only layer which means it's intended to be run by itself only.
         *
         * @returns {Boolean}
         */
        get runOnly() {
            return this[objectSymbol].runOnly || false;
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
         * Gets the working directory for this layer.
         *
         * @returns {String}
         */
        get workingDirectory() {
            let value = this[objectSymbol].workingDirectory;

            if (!value) {
                return value;
            }

            let matches = value.match(/\${([\w]+)}/);

            if (!matches) {
                return value;
            }

            for (let i = 0; i < matches.length; i += 2) {
                let path = null;

                if (this.application.directories && this.application.directories[matches[i + 1]]) {
                    path = this.application.directories[matches[i + 1]].path;
                } else {
                    path = brain.directories[matches[i + 1]].path;
                }

                value = value.replace(matches[i], path);
            }

            return value;
        }

        /**
         * See's if this layer can be run or not.
         *
         * @returns {Promise}
         */
        canRun() {
            return new Promise(function (resolve, reject) {
                if (!this.runOnly) {
                    return reject(new Error('Cannot run this layer because it\'s not set as runOnly!'));
                }

                this.application.areLayersUp(this.dependentLayers).then(function (areUp) {
                    if (!areUp) {
                        return reject(new Error('All The necessary layers to run this layer aren\'t up! Please bring them up and try again!'));
                    }

                    resolve(true);
                }).catch(reject);
            }.bind(this));
        }

        /**
         * Brings this layer down.
         *
         * @param {Object} options - options passed in from the user
         * @returns {Promise}
         */
        down(options) {
            return new Promise(function (resolve, reject) {
                let self = this;

                this.isUp().then(function (isUp) {
                    if (!isUp) {
                        return resolve();
                    }

                    self.container.stop(function (err) {
                        if (err) {
                            return reject(err);
                        }

                        brain.logger.info(`${self.containerName} is now down!`);

                        if (options.rm) {
                            self.container.remove((err) => err ? reject(err) : resolve());
                        } else {
                            resolve();
                        }
                    });
                }).catch(reject);
            }.bind(this));
        }

        /**
         * Checks to see if this layer is up.
         *
         * @returns {Promise}
         */
        isUp() {
            return new Promise(function (resolve) {
                this.container.inspect(function (err, data) {
                    // If there is an error returned then the container hasn't been created
                    if (err) {
                        return resolve(false);
                    }

                    // Else it has been created so we check if it's running based on what the inspect command tells us
                    resolve(data.State.Running || false);
                });
            }.bind(this));
        }

        /**
         * Pulls the image needed for this layer.
         *
         * @param {Object} options - options passed in from the user
         * @returns {Promise}
         */
        pull() {
            return new Promise(function (resolve, reject) {
                let address = brain.settings.repositoryAuth.serveraddress;

                if (address.indexOf('://') !== 0) {
                    address = address.substr(address.indexOf('://') + 3, address.length);
                }

                let fromCustomRepo = this.image.indexOf(address) > -1;

                if (fromCustomRepo && !brain.settings.repositoryAuth) {
                    return reject(new Error('No repository auth is set in the settings.json file!'));
                }

                brain.logger.info(`Started pull for ${this.name} (${this.image})`);

                let pullOpts = fromCustomRepo ? {authconfig: brain.settings.repositoryAuth} : {};

                let self = this;

                brain.docker.pull(this.image, pullOpts, function (err, stream) {
                    if (err || stream === null) {
                        brain.logger.error('Error pulling ' + self.name + ' (' + self.image + ')');
                        return reject(err);
                    }

                    brain.docker.modem.followProgress(stream, function (err, output) {
                        if (err) {
                            return reject(err);
                        }

                        brain.logger.info('Finished pull for ' + self.name + ' (' + self.image + ')');
                        resolve(output);
                    });
                });
            }.bind(this));
        }

        /**
         * Restarts this layer.
         *
         * @param {Object} options - options passed in from the user
         * @returns {Promise}
         */
        restart(options) {
            let self = this;

            return new Promise(function (resolve, reject) {
                this.isUp().then(function (isUp) {
                    if (!isUp) {
                        return self.up(options).then(resolve).catch(reject);
                    }

                    brain.logger.info(`${self.containerName} is being restarted!`);

                    self.container.restart(function (err) {
                        if (err) {
                            return reject(err);
                        }

                        brain.logger.info(`${self.containerName} has been restarted!`);
                        resolve();
                    });
                }).catch(reject);
            }.bind(this));
        }

        /**
         * This runs a layer for the application that's set as runOnly. The stdin is attached and allows interaction with the container.
         *
         * @param {Object|Array} options - options passed in from the user
         * @returns {Promise}
         */
        run(options) {
            let self = this;

            return new Promise(function (resolve, reject) {
                this.container.remove(function () {
                    let dOpts = self.dockerOptions;

                    // Change our specific options for Docker
                    dOpts.Cmd = self.command.concat(options instanceof Array ? options : options._raw.slice(options._raw.indexOf(self.name) + 1));
                    dOpts.AttachStdin = true;
                    dOpts.AttachStdout = true;
                    dOpts.AttachStderr = true;
                    dOpts.Tty = true;
                    dOpts.OpenStdin = true;
                    dOpts.StdinOnce = false;

                    brain.docker.getImage(self.image).get(function (err) {
                        if (err) {
                            pullAndUp();
                        } else {
                            runIt();
                        }
                    });

                    function pullAndUp() {
                        self.pull().then(runIt).catch(reject);
                    }

                    function runIt() {
                        brain.run(dOpts).then(function (err) {
                            if (err) {
                                return reject(err);
                            }

                            if (self.runAfter) {
                                async.eachSeries(self.runAfter, function (ra, next) {
                                    ra.layer.canRun().then(function () {
                                        return ra.layer.run(ra.command);
                                    }).then(() => next()).catch(next);
                                }, (err) => err ? reject(err) : resolve());
                            }
                        }).catch(reject);
                    }
                });
            }.bind(this));
        }

        /**
         * This brings this layer up if it needs to be brought up.
         *
         * @param {Object} options - options passed in from the user
         * @returns {Promise}
         */
        up(options) {
            let self = this;

            return new Promise(function (resolve, reject) {
                if (self.dataOnly) {
                    brain.logger.info(`Creating data only container for ${self.containerName}!`);
                } else {
                    brain.logger.info(`${self.containerName} is starting up!`);
                }

                this.isUp().then(function (isUp) {
                    if (isUp) {
                        // This layer is already up, so there is no need to bring it up again
                        return resolve();
                    }

                    let bringUp = function () {
                        self.container.remove(function () {
                            brain.docker.createContainer(self.dockerOptions, function (err, container) {
                                if (err) {
                                    return reject(err);
                                }

                                // This is a data only container, so we don't need to run it
                                if (self.dataOnly) {
                                    brain.logger.info(`${self.containerName} data container has been created!`);
                                    return resolve();
                                }

                                container.start(function (err) {
                                    if (err) {
                                        return reject(err);
                                    }

                                    brain.logger.info(`${self.containerName} is now up!`);

                                    resolve();
                                });
                            });
                        });
                    };

                    let pullAndUp = function () {
                        self.pull(options).then(bringUp).catch(reject);
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
            }.bind(this));
        }
    };
})();
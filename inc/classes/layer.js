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
var Volume = require('./volume');
var VolumeFrom = require('./volumeFrom');
var Environment = require('./environment');

var bytes = require('bytes');
var sprintf = require("sprintf-js").sprintf;

// Symbol for storing the objects properties
var objectSymbol = Symbol();

module.exports = class Layer {
    constructor(name, originalObject) {
        this[objectSymbol] = {};

        this[objectSymbol].name = name;

        for (var propName in originalObject) {
            if (originalObject.hasOwnProperty(propName)) {
                this[objectSymbol][propName] = originalObject[propName];
            }
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

    get name() {
        return this[objectSymbol].name;
    }

    getContainerName(applicationName) {
        return sprintf('%s_%s', applicationName, this[objectSymbol].name);
    }

    get image() {
        return this[objectSymbol].image;
    }

    get dataOnly() {
        return this[objectSymbol].dataOnly;
    }

    get restart() {
        return this[objectSymbol].restart;
    }

    get shouldRestart() {
        return this.restart;
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

    getDockerOptions(applicationName) {
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
            name: this.getContainerName(applicationName),
            HostConfig: {}
        };

        if (this.restart) {
            dockerOptions.HostConfig.RestartPolicy = {"Name": "always"};
        }

        if (this.environment && this.environment.length > 0) {
            dockerOptions.Env = [];

            this.environment.forEach(function (env) {
                dockerOptions.Env.push(sprintf('%s=%s', env.name, env.value));
            });
        }

        if (this.volumes && this.volumes.length > 0) {
            dockerOptions.HostConfig.Binds = [];

            this.volumes.forEach(function (volume) {
                dockerOptions.HostConfig.Binds.push(sprintf('%s:%s', volume.host, volume.container) + (volume.readOnly ? ':ro' : ''));
            });
        }

        if (this.volumesFrom && this.volumesFrom.length > 0) {
            dockerOptions.VolumesFrom = [];

            this.volumesFrom.forEach(function (container) {
                dockerOptions.VolumesFrom.push(sprintf('%s_%s', applicationName, container.container));
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
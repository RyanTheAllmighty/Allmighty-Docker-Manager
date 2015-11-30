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

    // Require all the external modules
    let fs = require('fs');
    let _ = require('lodash');
    let path = require('path');
    let Docker = require('dockerode');
    let timediff = require('timediff');
    let sprintf = require('sprintf-js').sprintf;

    // Now our applications specific classes
    let Component = require('./classes/component');
    let Application = require('./classes/application');

    // Require our logger
    let logger = require('./logger');

    // Now require our settings json file
    let settings = require(path.join(global.storagePath, 'settings.json'));

    // Now our objects to store our components and applications in
    let _components = {};
    let _applications = {};

    module.exports.directories = fs.existsSync(path.join(global.storagePath, 'directories.json')) ? require(path.join(global.storagePath, 'directories.json')) : {};

    module.exports.docker = getDockerInstance();

    module.exports.logger = logger;

    module.exports.settings = settings;

    module.exports.load = function () {
        _applications = this.loadApplications();
        _components = this.loadComponents();
    };

    module.exports.getBaseDirectory = function () {
        return path.join(global.storagePath);
    };

    module.exports.getApplicationsAsArray = function () {
        return Object.keys(_applications).map(function (key) {
            return _applications[key];
        });
    };

    module.exports.getApplication = function (name) {
        let application = _applications[name];

        if (!application) {
            application = _.find(_applications, function (app) {
                return app.applicationName.indexOf(name) === 0;
            });
        }

        return application;
    };

    module.exports.getApplications = function (name) {
        if (!name) {
            return _applications;
        }

        let application = _applications[name];
        let applications = [];

        if (!application) {
            let star = name.indexOf('*');

            if (star === -1) {
                application = _.filter(_applications, function (app) {
                    return app.applicationName.indexOf(name) === 0;
                });
            } else {
                applications = _.filter(_applications, function (app) {
                    return app.applicationName.indexOf(name.substr(0, star)) === 0;
                });
            }
        }

        return application ? [application] : applications;
    };

    module.exports.isApplicationSync = function (name) {
        let exists = name in _applications;

        if (!exists) {
            let star = name.indexOf('*');

            if (star === -1) {
                let apps = _.filter(_applications, function (app) {
                    return app.applicationName.indexOf(name) === 0;
                });

                exists = apps.length === 1;
            } else {
                let apps = _.filter(_applications, function (app) {
                    return app.applicationName.indexOf(name.substr(0, star)) === 0;
                });

                exists = apps.length !== 0;
            }
        }

        return exists;
    };

    module.exports.isApplication = function (name, callback) {
        callback(this.isApplicationSync(name));
    };

    module.exports.getComponents = function () {
        return _components;
    };

    module.exports.getComponentsAsArray = function () {
        return Object.keys(_components).map(function (key) {
            return _components[key];
        });
    };

    module.exports.getComponent = function (name) {
        let component = _components[name];

        if (!component) {
            component = _.find(_components, function (comp) {
                return comp.name.indexOf(name) === 0;
            });
        }

        return component;
    };

    module.exports.isComponent = function (name) {
        let exists = name in _components;

        if (!exists) {
            let comps = _.filter(_components, function (comp) {
                return comp.name.indexOf(name) === 0;
            });

            exists = comps.length === 1;
        }

        return exists;
    };

    module.exports.loadComponents = function () {
        let componentNames = fs.readdirSync(this.getComponentsDirectory()).filter(function (file) {
            return fs.statSync(path.join(this.getComponentsDirectory(), file)).isDirectory();
        }, this);

        let components = {};

        _.forEach(componentNames, function (name) {
            components[name] = new Component(name);
        });

        return components;
    };

    module.exports.loadApplications = function () {
        let self = this;

        let applicationNames = _.map(fs.readdirSync(this.getApplicationsDirectory()).filter(function (file) {
            return file.substr(-5) === '.json';
        }), function (app) {
            return app.substr(0, app.length - 5);
        });

        let applications = {};

        _.forEach(applicationNames, function (name) {
            applications[name] = new Application(name, require(path.join(self.getApplicationsDirectory(), name + '.json')));
        });

        return applications;
    };

    module.exports.getComponentsDirectory = function () {
        return path.join(global.storagePath, 'components');
    };

    module.exports.getApplicationsDirectory = function () {
        return path.join(global.storagePath, 'applications');
    };

    module.exports.getRunningContainerNames = function (callback) {
        module.exports.docker.listContainers({all: false}, function (err, containers) {
            if (err) {
                return callback(err);
            }

            let names = _.reduceRight(_.map(containers, 'Names'), function (flattened, other) {
                return flattened.concat(other);
            });

            names = _.map(names, function (name) {
                return name.substring(1);
            });

            names = _.filter(names, function (name) {
                return !name.match(/\//g);
            });

            callback(null, names);
        });
    };

    module.exports.getRunningContainers = function (callback) {
        module.exports.docker.listContainers({all: false}, function (err, containers) {
            if (err) {
                return callback(err);
            }

            callback(null, containers);
        });
    };

    module.exports.haveImage = function (name, callback) {
        module.exports.docker.getImage(name).get(function (err) {
            callback(null, !err);
        });
    };

    module.exports.parseTimeDifference = function (from, to) {
        if (!to) {
            to = new Date();
        }

        let diff = timediff(from, to, 'YMWDHmS');

        let diffString = '';

        if (diff.years) {
            diffString += (diffString.length !== 0 ? ', ' : '') + diff.years + ' year' + (diff.years === 1 ? '' : 's');
        }

        if (diff.months) {
            diffString += (diffString.length !== 0 ? ', ' : '') + diff.months + ' month' + (diff.months === 1 ? '' : 's');
        }

        if (diff.weeks) {
            diffString += (diffString.length !== 0 ? ', ' : '') + diff.weeks + ' week' + (diff.weeks === 1 ? '' : 's');
        }

        if (diff.days) {
            diffString += (diffString.length !== 0 ? ', ' : '') + diff.days + ' day' + (diff.days === 1 ? '' : 's');
        }

        diffString += (diffString.length !== 0 ? ', ' : '') + sprintf('%02d:%02d:%02d', diff.hours, diff.minutes, diff.seconds);

        return diffString;
    };

    module.exports.run = function (dockerOptions, callback) {
        module.exports.docker.createContainer(dockerOptions, function (err, container) {
            if (err) {
                return callback(err);
            }

            let attach_opts = {stream: true, stdin: true, stdout: true, stderr: true};

            container.attach(attach_opts, function handler(err, stream) {
                // Show outputs
                stream.pipe(process.stdout);

                // Connect stdin
                let isRaw = process.isRaw;
                process.stdin.resume();
                process.stdin.setEncoding('utf8');
                process.stdin.setRawMode(true);
                process.stdin.pipe(stream);

                function resizeTTY() {
                    let dimensions = {
                        h: process.stdout.rows,
                        w: process.stderr.columns
                    };

                    if (dimensions.h !== 0 && dimensions.w !== 0) {
                        container.resize(dimensions, function () {
                        });
                    }
                }

                container.start(function (err) {
                    if (err) {
                        return exit(stream, isRaw, function () {
                            callback(err);
                        });
                    }

                    resizeTTY();

                    process.stdout.on('resize', function () {
                        resizeTTY();
                    });

                    container.wait(function (err) {
                        if (err) {
                            return exit(stream, isRaw, function () {
                                callback(err);
                            });
                        }

                        process.stdout.removeListener('resize', resizeTTY);
                        process.stdin.removeAllListeners();
                        process.stdin.setRawMode(isRaw);
                        process.stdin.resume();
                        stream.end();

                        container.remove(callback);
                    });
                });
            });
        });
    };

    function getDockerInstance() {
        if (settings.dockerSocket) {
            return new Docker({socketPath: settings.dockerSocket});
        } else {
            let dockerObj = settings.dockerHttp;

            dockerObj.ca = fs.readFileSync(dockerObj.ca);
            dockerObj.cert = fs.readFileSync(dockerObj.cert);
            dockerObj.key = fs.readFileSync(dockerObj.key);

            return new Docker(dockerObj);
        }
    }

    function exit(stream, isRaw, callback) {
        process.stdin.removeAllListeners();
        process.stdin.setRawMode(isRaw);
        process.stdin.resume();
        stream.end();
        callback();
    }
})();
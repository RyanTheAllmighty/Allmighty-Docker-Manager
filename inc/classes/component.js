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

    let fs = require('fs');
    let tmp = require('tmp');
    let _ = require('lodash');
    let path = require('path');
    let async = require('async');
    let Table = require('cli-table2');
    let spawn = require('child_process').spawn;
    let sprintf = require('sprintf-js').sprintf;

    // Symbol for storing the objects properties
    let objectSymbol = Symbol();

    module.exports = class Component {
        /**
         * Constructor to create a new Component.
         *
         * @param {String} name - the name of this component
         */
        constructor(name) {
            this[objectSymbol] = {
                name
            };
        }

        /**
         * Gets the path to the folder where this component is stored.
         *
         * @returns {String}
         */
        get directory() {
            return path.join(brain.getComponentsDirectory(), this.name);
        }

        /**
         * Gets the name of this component.
         *
         * @returns {String}
         */
        get name() {
            return this[objectSymbol].name;
        }

        /**
         * Gets the tag name for this component, used as the tag name when building and pushing.
         *
         * @returns {String}
         */
        get tagName() {
            if (!brain.settings.repositoryAuth.serveraddress || brain.settings.repositoryAuth.serveraddress.indexOf('https://index.docker.io') === 0) {
                return sprintf('%s/%s', brain.settings.repositoryAuth.username, this.name);
            } else {
                let address = brain.settings.repositoryAuth.serveraddress;

                if (address.indexOf('://') !== 0) {
                    address = address.substr(address.indexOf('://') + 3, address.length);
                }

                return sprintf('%s/%s', address, this.name);
            }
        }

        /**
         * Gets the path to the adm-util.js file for this component.
         *
         * @returns {String}
         */
        get utilFile() {
            return path.join(this.directory, 'adm-util.js');
        }

        /**
         * Gets the modules needed for the util file for this component.
         *
         * @returns {Object}
         */
        get utilModules() {
            let neededModules = require(this.utilFile).modules;
            let modules = {};

            if (neededModules) {
                _.forEach(neededModules, function (module) {
                    if (typeof module === 'object') {
                        if (module[Object.keys(module)[0]] === '{ADMBrain}') {
                            modules[Object.keys(module)[0]] = brain;
                        } else {
                            modules[Object.keys(module)[0]] = require(module[Object.keys(module)[0]]);
                        }
                    } else if (typeof module === 'string') {
                        modules[module] = require(module);
                    }
                });
            }

            return modules;
        }

        /**
         * Builds this component into a Docker image.
         *
         * @param {Object} options - options passed in from the user
         * @returns {Promise}
         */
        build(options) {
            let self = this;

            return new Promise(function (resolve, reject) {
                if (options.versions) {
                    return this.getAvailableVersions(options).then(function (versions) {
                        let table = new Table();

                        let tRow = [];

                        async.eachSeries(versions, function (version, next) {
                            if (tRow.length === 10) {
                                table.push(tRow);
                                tRow = [];
                            }

                            brain.docker.getImage(self.tagName + ':' + version).inspect(function (err) {
                                if (err) {
                                    tRow.push(version.red);
                                    return next();
                                }

                                tRow.push(version.green);
                                next();
                            });
                        }, function () {
                            if (tRow.length !== 0) {
                                table.push(tRow);
                                tRow = [];
                            }

                            brain.logger.raw(table.toString());
                            brain.logger.line();

                            resolve();
                        });
                    }).catch(reject);
                }

                this.getBuildOptions(options).then(function (buildOpts) {
                    let nameVerString = buildOpts.t.substr(buildOpts.t.lastIndexOf('/') + 1);

                    brain.logger.info('Started build for ' + nameVerString);

                    tmp.file(function (err, path, fd, cleanupCallback) {
                        if (err) {
                            cleanupCallback();

                            return reject(err);
                        }

                        let tarArgs = [
                            '-cf',
                            path,
                            '-C',
                            self.directory,
                            '.'
                        ];

                        let tarPS = spawn('tar', tarArgs);

                        tarPS.on('close', function (code) {
                            if (code !== 0) {
                                return reject(new Error(`A non 0 exit code! ${code} was returned when trying to tar the folder!`));
                            }

                            brain.docker.buildImage(path, buildOpts, function (err, stream) {
                                if (err || stream === null) {
                                    brain.logger.error('Error building ' + nameVerString);
                                    return reject(err);
                                }

                                brain.docker.modem.followProgress(stream, function (err) {
                                    if (err) {
                                        return reject(err);
                                    }

                                    brain.logger.info('Finished build for ' + nameVerString);

                                    let image = brain.docker.getImage(buildOpts.t);

                                    if (options.tags && options.tags.length !== 0) {
                                        async.eachSeries(options.tags, function (tag, next) {
                                            image.tag({repo: self.tagName, tag: tag, force: true}, next);
                                        }, (err) => err ? reject(err) : resolve());
                                    } else {
                                        resolve();
                                    }
                                }, function (progress) {
                                    if (progress) {
                                        if (progress.error) {
                                            return reject(new Error(progress.error.errorDetail.message));
                                        }

                                        if (!options.quiet) {
                                            if (progress.stream) {
                                                process.stdout.write(progress.stream);
                                            }
                                        }
                                    }
                                });
                            });
                        });
                    });
                }).catch(reject);
            }.bind(this));
        }

        /**
         * This gets the available versions for this component if a 'adm-util.js' file is provided with the component with the 'getAvailableVersions' method in it.
         *
         * @param {Object} options - options passed in from the user
         * @returns {Promise}
         */
        getAvailableVersions(options) {
            return new Promise(function (resolve, reject) {
                if (fs.existsSync(this.utilFile)) {
                    let utils = require(this.utilFile);

                    if (typeof utils.getAvailableVersions === 'function') {
                        utils.getAvailableVersions(options, this.utilModules).then(function (versions) {
                            resolve(versions);
                        }).catch(reject);
                    } else {
                        resolve(['latest']);
                    }
                } else {
                    resolve(['latest']);
                }
            }.bind(this));
        }

        /**
         * This gets the build options for this component.
         *
         * @param {Object} options - options passed in from the user
         * @returns {Promise}
         */
        getBuildOptions(options) {
            return new Promise(function (resolve, reject) {
                let buildOpts = {
                    t: this.tagName
                };

                if (options.noCache) {
                    buildOpts.nocache = true;
                }

                if (!options.version && fs.existsSync(this.utilFile)) {
                    let utils = require(this.utilFile);

                    if (typeof utils.getLatestVersion === 'function') {
                        utils.getLatestVersion(options, this.utilModules).then(function (version) {
                            buildOpts.t += `:${version}`;
                            buildOpts.buildargs = JSON.stringify({VERSION: version});

                            resolve(buildOpts);
                        }).catch(reject);
                    } else {
                        buildOpts.t += ':latest';

                        resolve(buildOpts);
                    }
                } else if (options.version) {
                    buildOpts.t += `:${options.version}`;
                    buildOpts.buildargs = JSON.stringify({VERSION: options.version});

                    resolve(buildOpts);
                } else {
                    buildOpts.t += ':latest';

                    resolve(buildOpts);
                }
            }.bind(this));
        }

        /**
         * Pulls this component from the repository defined in the settings.
         *
         * @param {Object} options - options passed in from the user
         * @returns {Promise}
         */
        pull(options) {
            return new Promise(function (resolve, reject) {
                if (!brain.settings.repositoryAuth) {
                    return reject(new Error('No repository auth is set in the settings.json file!'));
                }

                brain.logger.info('Started pull for ' + this.name);

                let self = this;
                brain.docker.pull(this.tagName, {authconfig: brain.settings.repositoryAuth}, function (err, stream) {
                    if (err || stream === null) {
                        brain.logger.error('Error pulling ' + self.name);
                        return reject(err);
                    }
                    brain.docker.modem.followProgress(stream, function (err, output) {
                        if (err) {
                            return reject(err);
                        }

                        brain.logger.info('Finished pull for ' + self.name);
                        resolve(output);
                    }, function (progress) {
                        if (progress) {
                            if (progress.error) {
                                return reject(new Error(progress.error.errorDetail.message));
                            }

                            if (!options.quiet) {
                                if (progress.status && !progress.progress) {
                                    if (progress.id) {
                                        process.stdout.write(progress.id + ': ');
                                    }

                                    process.stdout.write(progress.status);
                                    process.stdout.write('\n');
                                }
                            }
                        }
                    });
                });
            }.bind(this));
        }

        /**
         * Pushes this built component to the repository defined in the settings.
         *
         * @param {Object} options - options passed in from the user
         * @returns {Promise}
         */
        push(options) {
            return new Promise(function (resolve, reject) {
                if (!brain.settings.repositoryAuth) {
                    return reject(new Error('No repository auth is set in the settings.json file!'));
                }

                brain.logger.info('Started push for ' + this.name);

                let self = this;
                brain.docker.getImage(this.tagName).push({authconfig: brain.settings.repositoryAuth}, function (err, stream) {
                    if (err || stream === null) {
                        brain.logger.error('Error pushing ' + self.name);
                        return reject(err);
                    }

                    brain.docker.modem.followProgress(stream, function (err, output) {
                        if (err) {
                            return reject(err);
                        }

                        brain.logger.info('Finished push for ' + self.name);
                        resolve(output);
                    }, function (progress) {
                        if (progress) {
                            if (progress.error) {
                                return reject(new Error(progress.error.errorDetail.message));
                            }

                            if (!options.quiet) {
                                if (progress.status && !progress.progress) {
                                    if (progress.id) {
                                        process.stdout.write(progress.id + ': ');
                                    }

                                    process.stdout.write(progress.status);
                                    process.stdout.write('\n');
                                }
                            }
                        }
                    });
                });
            }.bind(this));
        }
    };
})();
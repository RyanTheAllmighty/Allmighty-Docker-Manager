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

    let moment = require('moment');
    let cronParser = require('cron-parser');

    // Symbol for storing the objects properties
    let objectSymbol = Symbol();

    module.exports = class Cron {
        /**
         * Constructor to create a new Cron object.
         *
         * @param {Application} application - the application instance this cron belongs to
         * @param {String} name - the name of this cron
         * @param {Object} originalObject - the object passed in which represents this cron. Parsed from json
         */
        constructor(application, name, originalObject) {
            this[objectSymbol] = {};

            this[objectSymbol]._application = application;
            this[objectSymbol]._name = name;

            // Copy over the original objects properties to this objects private Symbol
            for (let propName in originalObject) {
                if (originalObject.hasOwnProperty(propName)) {
                    this[objectSymbol][propName] = originalObject[propName];
                }
            }
        }

        /**
         * Returns the application that this cron is attached to.
         *
         * @returns {Application}
         */
        get application() {
            return this[objectSymbol]._application;
        }

        /**
         * Gets the cron expression on when this should run.
         *
         * @returns {String}
         */
        get at() {
            return this[objectSymbol].at;
        }

        /**
         * Returns the command to run on top of the runOnly layers command.
         *
         * @returns {String[]}
         */
        get command() {
            return this[objectSymbol].command || [];
        }

        /**
         * Returns the runOnly layer to run when this cron is executed.
         *
         * @returns {Layer}
         */
        get layer() {
            return this.application.getLayer(this[objectSymbol].run);
        }

        /**
         * Returns the name of this cron.
         *
         * @returns {String}
         */
        get name() {
            return this[objectSymbol]._name;
        }

        /**
         * Returns the name of the runOnly layer to run when this cron is executed.
         *
         * @returns {String}
         */
        get run() {
            return this[objectSymbol].run;
        }

        /**
         * Returns if this cron should be executed or not.
         *
         * @returns {Boolean}
         */
        get shouldExecute() {
            try {
                let interval = cronParser.parseExpression(this.at);

                let diff = moment().diff(moment(interval.next()), 'seconds');
                return diff >= -1 && diff <= 1;
            } catch (err) {
                brain.logger.error(err);
                return false;
            }
        }

        /**
         * This executes the cron.
         *
         * @param {Object} options - options passed in from the user
         * @returns {Promise}
         */
        execute() {
            return new Promise(function (resolve, reject) {
                brain.logger.info(`Running cron '${this.name}' for application '${this.application.applicationName}'!`);
                this.layer.run(this.command).then(() => resolve()).catch(reject);
            }.bind(this));
        }
    };
})();
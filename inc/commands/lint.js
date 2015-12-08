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
 * The lint command will check all the json files for ADM and lint them to see if they're valid.
 */

(function () {
    'use strict';

    let brain = require('../brain');

    let fs = require('fs');
    let _ = require('lodash');
    let path = require('path');
    let Validator = require('jsonschema').Validator;
    let v = new Validator();

    /**
     * Initializes this command with the given arguments and does some error checking to make sure we can actually run.
     *
     * @param {Object} passedArgs - An object of arguments
     * @returns {Promise}
     */
    module.exports.init = function () {
        return new Promise(function (resolve) {
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
            let results = [];

            results.push(validateFile(path.join(global.storagePath, 'settings.json')));
            results.push(validateFile(path.join(global.storagePath, 'directories.json')));

            let applicationNames = _.map(fs.readdirSync(brain.getApplicationsDirectory()).filter(function (file) {
                return fs.statSync(path.join(brain.getApplicationsDirectory(), file)).isDirectory() && fs.existsSync(path.join(brain.getApplicationsDirectory(), file, 'application.json'));
            }));

            _.forEach(applicationNames, function (name) {
                results.push(validateFile(path.join(brain.getApplicationsDirectory(), name, 'application.json')));
            });

            if (_.any(results, (res) => !res)) {
                reject(new Error('One or more files are invalid! See the errors above!'));
            } else {
                resolve();
            }
        });
    };

    function validateFile(filename) {
        brain.logger.info(filename);

        let file = JSON.parse(fs.readFileSync(filename).toString('utf8'));
        let schema = JSON.parse(fs.readFileSync(path.join(__dirname, '../', '../', 'schema', filename.substr(filename.lastIndexOf('/') + 1) + '.schema')).toString('utf8'));
        let result = v.validate(file, schema);

        if (!result.valid) {
            result.errors.forEach(function (error) {
                brain.logger.error(' - ' + error.stack.replace('instance.', ''));
            });
        } else {
            brain.logger.info(' - Valid');
        }

        brain.logger.line();

        return result.valid;
    }
})();
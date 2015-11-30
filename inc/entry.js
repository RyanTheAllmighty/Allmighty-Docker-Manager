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

    let fs = require('fs');
    let path = require('path');

    // This modifies the string prototype to add in coloured things
    require('colors');

    module.exports = function (args) {
        // Parse the arguments passed in
        let passedArgs = require('minimist')(args);
        passedArgs._raw = args;

        global.storagePath = passedArgs.storagePath || process.cwd();

        if (!fs.existsSync(path.join(global.storagePath, 'settings.json'))) {
            console.log(('Couldn\'t find a settings.json! Path: ' + global.storagePath).red);
            return process.exit(1);
        }

        // Load the brain in for the application
        let brain = require('../inc/brain');
        brain.load();

        if (passedArgs._.length === 0) {
            brain.logger.error('No arguments were passed in!');
            return process.exit(1);
        }

        // The action we're taking
        let action = passedArgs._.shift();

        // Check if that was the only element, if so remove it from the array
        if (passedArgs._.length === 0) {
            delete passedArgs._;
        }

        // Check the action is only letters
        if (!/^[a-zA-z]+$/.test(action)) {
            brain.logger.error('Invalid first argument passed in!');
            return process.exit(1);
        }

        // The file of the possible command
        let commandFile = path.join(__dirname, 'commands', action + '.js');

        // Check the js file exists in the command directory
        if (!fs.existsSync(commandFile)) {
            brain.logger.error('No command found for ' + action + '!');
            return process.exit(1);
        }

        // This is the command we want to run
        let command = require(commandFile);

        // First we need to initialize it with the arguments passed in to do some sanity checks and processing
        command.init(passedArgs).then(command.run).then(function () {
            process.exit(0);
        }).catch(function (err) {
            brain.logger.error(err);
            return process.exit(1);
        });
    };
})();
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
 * The status command gets the status of all layers for all applications and checks if they are online or not.
 */

(function () {
    'use strict';

    // This modifies the string prototype to add in coloured things
    require('colors');

    global.storagePath = require('path').join(process.cwd(), 'test', 'files');

    // Load the brain in for the application
    let brain = require('../inc/brain');
    brain.load();

    global.parseArgs = function (args) {
        if (!args) {
            args = [];
        } else if (typeof args === 'string') {
            if (args.indexOf(' ') === -1) {
                args = [args];
            } else {
                args = args.split(' ');
            }
        }

        let passedArgs = require('minimist')(args);
        passedArgs._raw = args;

        return passedArgs;
    };
})();
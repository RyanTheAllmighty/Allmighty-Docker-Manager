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

let colours = require('colors');

let settings = require('../settings.json');

module.exports.debug = function (message) {
    if (settings.logging.level && settings.logging.level == 'debug') {
        console.log(message.blue);
    }
};

module.exports.error = function (message) {
    if (message instanceof Error) {
        console.error(message.message.red);
    } else {
        console.log(message.red);
    }
};

module.exports.info = function (message) {
    console.log(message.green);
};

module.exports.warning = function (message) {
    console.log(message.yellow);
};

module.exports.raw = function (message) {
    process.stdout.write(message);
};

module.exports.line = function () {
    console.log();
};
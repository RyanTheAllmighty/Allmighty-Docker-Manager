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

    let path = require('path');

    let settings = require(path.join(global.storagePath, 'settings.json'));

    let usersDebugLevel = settings.logging.debugLevel || 1;

    let benchmarkValues = {};

    module.exports.benchmark = {
        start: function (name) {
            benchmarkValues[name] = process.hrtime();
        },
        stop: function (name) {
            if (benchmarkValues.hasOwnProperty(name)) {
                let diff = process.hrtime(benchmarkValues[name]);

                delete benchmarkValues[name];

                if (settings.logging.level && settings.logging.level === 'debug' && usersDebugLevel === 5) {
                    console.log('[Benchmark] '.blue + `[${name}]`.yellow + ' %d ms'.white, ((diff[0] * 1000) + (diff[1] / 1000000)).toFixed(4));
                }
            }
        }
    };

    module.exports.debug = function (message, level) {
        if (!level) {
            level = 1;
        }

        if (settings.logging.level && settings.logging.level === 'debug' && usersDebugLevel >= level) {
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
})();
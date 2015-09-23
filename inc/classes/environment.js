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

let brain = require('../brain');

// Symbol for storing the objects properties
let objectSymbol = Symbol();

module.exports = class Environment {
    /**
     * Constructor to create a new Environment.
     *
     * @param {Object} originalObject - the object passed in which represents this application. Parsed from json
     */
    constructor(originalObject) {
        this[objectSymbol] = {};

        // Copy over the original objects properties to this objects private Symbol
        for (let propName in originalObject) {
            if (originalObject.hasOwnProperty(propName)) {
                this[objectSymbol][propName] = originalObject[propName];
            }
        }
    }

    /**
     * Gets the name of this environment variable.
     *
     * @returns {String}
     */
    get name() {
        return this[objectSymbol].name;
    }

    /**
     * Gets the value of this environment variable.
     *
     * @returns {String}
     */
    get value() {
        return this[objectSymbol].value instanceof Array ? this[objectSymbol].value.join(',') : this[objectSymbol].value;
    }
};
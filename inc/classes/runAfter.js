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

    // Symbol for storing the objects properties
    let objectSymbol = Symbol();

    module.exports = class RunAfter {
        /**
         * Constructor to create a new Run After.
         *
         * @param {Layer} layer - the layer that this belongs to
         * @param {Object} originalObject - the object passed in which represents this application. Parsed from json
         */
        constructor(layer, originalObject) {
            this[objectSymbol] = {};

            this[objectSymbol]._layer = layer;

            // Copy over the original objects properties to this objects private Symbol
            for (let propName in originalObject) {
                if (originalObject.hasOwnProperty(propName)) {
                    this[objectSymbol][propName] = originalObject[propName];
                }
            }
        }

        /**
         * Gets the command to run.
         *
         * @returns {String[]}
         */
        get command() {
            if (!this[objectSymbol].command) {
                return [];
            } else if (!(this[objectSymbol].command instanceof Array)) {
                return [this[objectSymbol].command];
            } else {
                return this[objectSymbol].command;
            }
        }

        /**
         * Gets the layer we are going to run.
         *
         * @returns {Layer|Null}
         */
        get layer() {
            return this[objectSymbol]._layer.application.getLayer(this.layerName);
        }

        /**
         * Gets the name of the run only layer to run.
         *
         * @returns {String}
         */
        get layerName() {
            return this[objectSymbol].layer;
        }
    };
})();
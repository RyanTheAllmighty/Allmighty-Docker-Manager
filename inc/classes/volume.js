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

    // Symbol for storing the objects properties
    let objectSymbol = Symbol();

    module.exports = class Volume {
        /**
         * Constructor to create a new Volume.
         *
         * @param {Layer} layer - the layer tha this volume belongs to
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
         * Gets the path to mount this volume inside the container.
         *
         * @returns {String}
         */
        get container() {
            return this[objectSymbol].container;
        }

        /**
         * Gets the path on the host system to mount inside the container.
         *
         * \${([\w]+)}
         *
         * @returns {String}
         */
        get host() {
            let value = this[objectSymbol].host;

            let matches = value.match(/\${([\w]+)}/);

            if (!matches) {
                return value;
            }

            for (let i = 0; i < matches.length; i += 2) {
                value = value.replace(matches[i], brain.settings.directories.storage.slice(0, -1) + this.layer.application.directories[matches[i + 1]].path);
            }

            return value;
        }

        /**
         * Gets the layer that this volume belongs to.
         *
         * @returns {Layer}
         */
        get layer() {
            return this[objectSymbol]._layer;
        }

        /**
         * Gets if this should be a read only mount.
         *
         * @returns {Boolean}
         */
        get readOnly() {
            return this[objectSymbol].readOnly === true;
        }
    };
})();
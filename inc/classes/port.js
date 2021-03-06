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

    module.exports = class Port {
        /**
         * Constructor to create a new Port.
         *
         * @param {Layer} layer - the layer than this port object belongs to
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
         * Gets the port number in the container to expose.
         *
         * @returns {Number}
         */
        get container() {
            return this[objectSymbol].container;
        }

        /**
         * Gets the port number to map to the container on the host.
         *
         * @returns {Number}
         */
        get host() {
            return this[objectSymbol].host;
        }

        /**
         * Gets the IP to use on the host to bind to for this port (if any).
         *
         * @returns {String|null}
         */
        get ip() {
            return (typeof this[objectSymbol].ip !== 'undefined' ? brain.parseVariables(this.layer.application, this[objectSymbol].ip) : null);
        }

        /**
         * Gets the layer of this port.
         *
         * @returns {Layer}
         */
        get layer() {
            return this[objectSymbol]._layer;
        }

        /**
         * Gets if this port should open up the TCP ports.
         *
         * @returns {Boolean}
         */
        get tcp() {
            return (typeof this[objectSymbol].tcp === 'undefined' ? true : this[objectSymbol].tcp);
        }

        /**
         * Gets if this port should open up the UDP ports.
         *
         * @returns {Boolean}
         */
        get udp() {
            return (typeof this[objectSymbol].udp === 'undefined' ? false : this[objectSymbol].udp);
        }
    };
})();
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

    let Layer = require('./layer');

    module.exports = class DataLayer extends Layer {
        /**
         * Constructor to create a new Data layer.
         *
         * @param {Application} application - the application instance this layer belongs to
         * @param {String} name - the name of this layer
         * @param {Object} originalObject - the object passed in which represents this layer. Parsed from json
         */
        constructor(application, name, originalObject) {
            super(application, name, originalObject);
        }

        /**
         * Returns if this layer is a data only layer which means it only holds data and shouldn't be started up.
         *
         * @returns {Boolean}
         */
        get dataOnly() {
            return true;
        }
    };
})();
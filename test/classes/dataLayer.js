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

    let expect = require('chai').expect;

    let DataLayer = require('../../inc/classes/dataLayer');

    describe('DataLayer', function () {
        let layer = new DataLayer({}, 'test', {
            image: 'test/test'
        });

        it('should create a DataLayer', function () {
            expect(layer instanceof DataLayer).to.equal(true);
        });

        describe('#dataOnly', function () {
            it('should return if the layer is a data only layer that shouldn\'t be run', function () {
                expect(layer.dataOnly).to.equal(true);
            });
        });
    });
})();
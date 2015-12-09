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

    let RunLayer = require('../../inc/classes/runLayer');

    describe('RunLayer', function () {
        let layer = new RunLayer({}, 'test', {
            image: 'test/test'
        });

        it('should create a RunLayer', function () {
            expect(layer instanceof RunLayer).to.equal(true);
        });

        describe('#runOnly', function () {
            it('should return if the layer is a run only layer', function () {
                expect(layer.runOnly).to.equal(true);
            });
        });
    });
})();
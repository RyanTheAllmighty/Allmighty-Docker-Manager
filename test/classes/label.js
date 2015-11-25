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

    let Label = require('../../inc/classes/label');

    describe('Label', function () {
        let label = new Label({
            name: 'test',
            value: 'value'
        });

        it('should create a port', function () {
            expect(label instanceof Label).to.equal(true);
        });

        describe('#name', function () {
            it('should return the labels name', function () {
                expect(label.name).to.equal('test');
            });
        });

        describe('#value', function () {
            it('should return the labels value', function () {
                expect(label.value).to.equal('value');
            });
        });
    });
})();
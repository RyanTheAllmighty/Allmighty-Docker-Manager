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

    let Environment = require('../../inc/classes/environment');

    describe('Environment', function () {
        let environment = new Environment({}, {
            name: 'TEST',
            value: 'test'
        });

        let environmentWithArray = new Environment({}, {
            name: 'TEST',
            value: [
                'test1',
                'test2'
            ]
        });

        it('should create an environment', function () {
            expect(environment instanceof Environment).to.equal(true);
        });

        describe('#name', function () {
            it('should return the name of an environment', function () {
                expect(environment.name).to.equal('TEST');
            });
        });

        describe('#value', function () {
            it('should return the value of an environment from a string', function () {
                expect(environment.value).to.equal('test');
            });

            it('should return the value of an environment from an array', function () {
                expect(environmentWithArray.value).to.equal('test1,test2');
            });
        });
    });
})();
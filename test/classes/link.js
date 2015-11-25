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

    let Link = require('../../inc/classes/link');

    describe('Link', function () {
        let linkWithName = new Link({
            container: 'testWithName',
            name: 'test'
        });

        let linkWithoutName = new Link({
            container: 'testWithoutName'
        });

        it('should create a link', function () {
            expect(linkWithName instanceof Link).to.equal(true);
            expect(linkWithoutName instanceof Link).to.equal(true);
        });

        describe('#container', function () {
            it('should return the container name for a link', function () {
                expect(linkWithName.container).to.equal('testWithName');
                expect(linkWithoutName.container).to.equal('testWithoutName');
            });
        });

        describe('#name', function () {
            it('should return the name of a link with a name', function () {
                expect(linkWithName.name).to.equal('test');
            });

            it('should return the name of a link without a name', function () {
                expect(linkWithoutName.name).to.equal('testWithoutName');
            });
        });
    });
})();
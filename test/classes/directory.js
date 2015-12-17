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

    let Directory = require('../../inc/classes/directory');

    describe('Directory', function () {
        let directory = new Directory({
            path: '/test',
            description: 'This is a test!'
        });

        it('should create a directory object', function () {
            expect(directory instanceof Directory).to.equal(true);
        });

        describe('#description', function () {
            it('should return the directories description', function () {
                expect(directory.description).to.equal('This is a test!');
            });
        });

        describe('#path', function () {
            it('should return the directories path', function () {
                expect(directory.path).to.equal('/tmp/adm/test');
            });
        });
    });
})();
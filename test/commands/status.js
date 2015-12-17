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

    let chai = require('chai');
    let expect = require('chai').expect;

    chai.use(require('chai-as-promised'));

    let Command = require('../../inc/commands/status');

    let defaultOptions = {_raw: ['status']};

    describe('adm status', function () {
        it('should initialize without issue', function () {
            return expect(Command.init(defaultOptions)).to.eventually.be.resolved;
        });

        it('should cause an issue when a non existing application is passed in', function () {
            return expect(Command.init({_raw: ['status', 'hello'], _: ['hello']})).to.eventually.be.rejectedWith('Error: No application exists called "hello"!');
        });
    });
})();
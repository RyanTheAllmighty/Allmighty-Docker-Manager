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

"use strict";

var expect = require('chai').expect;

var Port = require('../../inc/classes/port');

describe('Port', function () {
    var port = new Port({
        host: 80,
        container: 8888
    });

    it('should create a port', function () {
        expect(port instanceof Port).to.equal(true);
    });

    describe('#host', function () {
        it('should return the hosts port', function () {
            expect(port.host).to.equal(80);
        });
    });

    describe('#container', function () {
        it('should return the containers port', function () {
            expect(port.container).to.equal(8888);
        });
    });
});
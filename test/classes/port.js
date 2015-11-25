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

    let Port = require('../../inc/classes/port');

    describe('Port', function () {
        let port = new Port({
            host: 80,
            container: 8888
        });

        let portUDP = new Port({
            host: 80,
            container: 8888,
            tcp: false,
            udp: true
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

        describe('#tcp', function () {
            it('should return true when tcp isn\'t specified', function () {
                expect(port.tcp).to.equal(true);
            });

            it('should return false when tcp is specified as false', function () {
                expect(portUDP.tcp).to.equal(false);
            });
        });

        describe('#udp', function () {
            it('should return false when udp isn\'t specified', function () {
                expect(port.udp).to.equal(false);
            });

            it('should return true when udp is specified as true', function () {
                expect(portUDP.udp).to.equal(true);
            });
        });
    });
})();
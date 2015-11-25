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

    let Application = require('../../inc/classes/application');
    let Layer = require('../../inc/classes/layer');

    describe('Application', function () {
        let application = new Application('testapplication', {
            name: 'Test Application',
            description: 'This is a test application!',
            layers: {
                test: {}
            }
        });

        it('should create an Application', function () {
            expect(application instanceof Application).to.equal(true);
        });

        describe('#applicationName', function () {
            it('should return the internal name of the application', function () {
                expect(application.applicationName).to.equal('testapplication');
            });
        });

        describe('#name', function () {
            it('should return the name of the application', function () {
                expect(application.name).to.equal('Test Application');
            });
        });

        describe('#description', function () {
            it('should return the description of the application', function () {
                expect(application.description).to.equal('This is a test application!');
            });
        });

        describe('#layers', function () {
            it('should return all the layers of the application', function () {
                expect(application.layers.test instanceof Layer).to.equal(true);
            });
        });
    });
})();
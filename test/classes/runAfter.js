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

    let Layer = require('../../inc/classes/layer');
    let RunAfter = require('../../inc/classes/runAfter');
    let Application = require('../../inc/classes/application');

    describe('RunAfter', function () {
        let application = new Application('test', {
            layers: {
                test: {},
                'a-test': {
                    image: 'Working'
                }
            }
        });

        let runAfter = new RunAfter(application.getLayer('test'), {
            layer: 'a-test',
            command: ['testing', 'version']
        });

        it('should create a run after', function () {
            expect(runAfter instanceof RunAfter).to.equal(true);
        });

        describe('#command', function () {
            it('should return the command to run the layer with', function () {
                expect(runAfter.command).to.be.an('array');
                expect(runAfter.command[0]).to.equal('testing');
                expect(runAfter.command[1]).to.equal('version');
            });
        });

        describe('#layer', function () {
            it('should return the layer of the layer to run', function () {
                expect(runAfter.layer instanceof Layer).to.equal(true);
                expect(runAfter.layer.image).to.equal('Working:latest');
            });
        });

        describe('#layerName', function () {
            it('should return the name of a link with a name', function () {
                expect(runAfter.layerName).to.equal('a-test');
            });
        });
    });
})();
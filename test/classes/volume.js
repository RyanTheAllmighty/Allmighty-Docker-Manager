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
    let Volume = require('../../inc/classes/volume');
    let Application = require('../../inc/classes/application');

    describe('Volume', function () {
        let readWriteVolume = new Volume(new Layer(new Application('test', {}), 'test', {}), {
            host: '/test/readwrite',
            container: '/mnt/readwrite',
            readOnly: false
        });

        let readOnlyVolume = new Volume(new Layer(new Application('test', {}), 'test', {}), {
            host: '/test/readonly',
            container: '/mnt/readonly',
            readOnly: true
        });

        let fileVolume = new Volume(new Layer(new Application('test', {}), 'test', {}), {
            host: '/test/file.txt',
            container: '/mnt/file.txt',
            directory: false
        });

        let variableVolume = new Volume(new Layer(new Application('test', {
            directories: {
                test: {
                    path: '/test/variable',
                    description: 'Testing variable replacements!',
                    shared: false
                }
            }
        }), 'test', {}), {
            host: '${d:test}/hello',
            container: '/mnt/readonly',
            readOnly: true
        });

        let variableGlobalVolume = new Volume(new Layer(new Application('test', {
            directories: {
                test: {
                    path: '/test/variable',
                    description: 'Testing variable replacements!',
                    shared: false
                }
            }
        }), 'test', {}), {
            host: '${d:test_global}/hello',
            container: '/mnt/readonly',
            readOnly: true
        });

        let admVariableVolume = new Volume(new Layer(new Application('test', {}), 'test', {}), {
            host: '${d:__adm_application}/hello',
            container: '/mnt/readonly',
            readOnly: true
        });

        it('should create a read only Volume', function () {
            expect(readOnlyVolume instanceof Volume).to.equal(true);
            expect(readOnlyVolume.readOnly).to.equal(true);
        });

        it('should create a read write Volume', function () {
            expect(readWriteVolume instanceof Volume).to.equal(true);
            expect(readWriteVolume.readOnly).to.equal(false);
        });

        describe('#readOnly', function () {
            it('should return if the volume is read only', function () {
                expect(readWriteVolume.readOnly).to.equal(false);
                expect(readOnlyVolume.readOnly).to.equal(true);
            });
        });

        describe('#host', function () {
            it('should return the path to the volume on the host without variables', function () {
                expect(readOnlyVolume.host.indexOf('/test/readonly') > -1).to.equal(true);
            });

            it('should return the path to the volume on the host with variables', function () {
                expect(variableVolume.host.indexOf('/test/variable/hello') > -1).to.equal(true);
            });

            it('should return the path to the volume on the host with global variables', function () {
                expect(variableGlobalVolume.host.indexOf('/test/hello') > -1).to.equal(true);
            });

            it('should return the path to the volume on the host with ADM specific variables', function () {
                expect(admVariableVolume.host.indexOf('applications/test/hello') > -1).to.equal(true);
            });
        });

        describe('#container', function () {
            it('should return the path to the volume within the container', function () {
                expect(readOnlyVolume.container).to.equal('/mnt/readonly');
            });
        });

        describe('#directory', function () {
            it('should return if the volume is pointing to a file or not', function () {
                expect(readOnlyVolume.directory).to.equal(true);
                expect(fileVolume.directory).to.equal(false);
            });
        });
    });
})();
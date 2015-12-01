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
    let Port = require('../../inc/classes/port');
    let Label = require('../../inc/classes/label');
    let Layer = require('../../inc/classes/layer');
    let Volume = require('../../inc/classes/volume');
    let Application = require('../../inc/classes/application');
    let Environment = require('../../inc/classes/environment');

    describe('Layer', function () {
        let application = new Application('testapp', {
            name: 'Test Application'
        });

        let layer = new Layer(application, 'test', {
            image: 'test/test',
            dataOnly: false,
            runOnly: false,
            restart: true,
            memLimit: '1GB',
            cpuShares: 512,
            command: 'test some arguments --help',
            workingDirectory: '/some/dir',
            ports: [
                {
                    host: 80,
                    container: 80
                }
            ],
            labels: [
                {}
            ],
            links: [
                {}
            ],
            volumes: [
                {}
            ],
            volumesFrom: [
                {}
            ],
            environment: [
                {}
            ]
        });

        it('should create a Layer', function () {
            expect(layer instanceof Layer).to.equal(true);
        });

        describe('#application)', function () {
            it('should return the application this layer belongs to', function () {
                expect(layer.application instanceof Application).to.equal(true);
                expect(layer.application).to.equal(application);
            });
        });

        describe('#containerName)', function () {
            it('should return the name of the container this layer creates', function () {
                expect(layer.containerName).to.equal('testapp_test');
            });
        });

        describe('#name)', function () {
            it('should return the name of a layer', function () {
                expect(layer.name).to.equal('test');
            });
        });

        describe('#image)', function () {
            let imageWithoutVersion = new Layer(new Application('test', {}), 'test', {
                image: 'test/test'
            });

            let imageWithVersion = new Layer(new Application('test', {}), 'test', {
                image: 'test/test:test'
            });

            let imageWithoutRepositoryVersion = new Layer(new Application('test', {}), 'test', {
                image: '${repositoryURL}/test'
            });

            let imageWithRepositoryVersion = new Layer(new Application('test', {}), 'test', {
                image: '${repositoryURL}/test:test'
            });

            it('should return the image of a layer', function () {
                expect(imageWithoutVersion.image).to.equal('test/test:latest');
                expect(imageWithVersion.image).to.equal('test/test:test');
                expect(imageWithoutRepositoryVersion.image).to.equal('index.docker.io/v1/test:latest');
                expect(imageWithRepositoryVersion.image).to.equal('index.docker.io/v1/test:test');
            });
        });

        describe('#dataOnly', function () {
            it('should return if the layer is a data only layer that shouldn\'t be run', function () {
                expect(layer.dataOnly).to.equal(false);
            });
        });

        describe('#runOnly', function () {
            it('should return if the layer is a run only layer that should only be run as a single application', function () {
                expect(layer.runOnly).to.equal(false);
            });
        });

        describe('#shouldRestart)', function () {
            it('should return if the layer should restart or not', function () {
                expect(layer.shouldRestart).to.equal(true);
            });
        });

        describe('#memLimit', function () {
            it('should return the memory limit of a layer as undefined if not defined', function () {
                let testComponent = new Layer(new Application('test', {}), 'test', {});

                expect(testComponent.memLimit).to.be.an('undefined');
            });

            it('should return the memory limit of a layer', function () {
                expect(layer.memLimit).to.equal('1GB');
            });
        });

        describe('#cpuShares', function () {
            it('should return the number of CPU shares for a layer as 1024 if not defined', function () {
                let testComponent = new Layer(new Application('test', {}), 'test', {});

                expect(testComponent.cpuShares).to.equal(1024);
            });

            it('should return the number of CPU shares for a layer', function () {
                expect(layer.cpuShares).to.equal(512);
            });
        });

        describe('#workingDirectory', function () {
            it('should return the working directory for a layer', function () {
                expect(layer.workingDirectory).to.equal('/some/dir');
            });
        });

        describe('#command', function () {
            it('should return the command of a layer', function () {
                expect(layer.command).to.be.an('array');
                expect(layer.command[0]).to.equal('test some arguments --help');
            });
        });

        describe('#ports', function () {
            it('should return the ports of a layer', function () {
                expect(layer.ports).to.be.an('array');
                expect(layer.ports[0] instanceof Port).to.equal(true);
            });
        });

        describe('#links', function () {
            it('should return the links of a layer', function () {
                expect(layer.links).to.be.an('array');
                expect(layer.links[0] instanceof Link).to.equal(true);
            });
        });

        describe('#labels', function () {
            it('should return the labels of a layer', function () {
                expect(layer.labels).to.be.an('array');
                expect(layer.labels[0] instanceof Label).to.equal(true);
            });
        });

        describe('#volumes', function () {
            it('should return the volumes of a layer', function () {
                expect(layer.volumes).to.be.an('array');
                expect(layer.volumes[0] instanceof Volume).to.equal(true);
            });
        });

        describe('#volumesFrom', function () {
            it('should return the volumes of other containers for a layer', function () {
                expect(layer.volumesFrom).to.be.an('array');
                //expect(layer.volumesFrom[0] instanceof VolumeFrom).to.equal(true);
            });
        });

        describe('#environment', function () {
            it('should return the environment of a layer', function () {
                expect(layer.environment).to.be.an('array');
                expect(layer.environment[0] instanceof Environment).to.equal(true);
            });
        });
    });
})();
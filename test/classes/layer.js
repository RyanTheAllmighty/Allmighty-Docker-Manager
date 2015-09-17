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

var _ = require('lodash');
var expect = require('chai').expect;

var Link = require('../../inc/classes/link');
var Port = require('../../inc/classes/port');
var Layer = require('../../inc/classes/layer');
var Volume = require('../../inc/classes/volume');
var VolumeFrom = require('../../inc/classes/volumefrom');
var Environment = require('../../inc/classes/environment');

describe('Layer', function () {
    var layer = new Layer('test', {
        image: "test/test",
        dataOnly: false,
        restart: true,
        memLimit: "1GB",
        command: "test some arguments --help",
        ports: [
            {
                host: 80,
                container: 80
            }
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
        "environment": [
            {}
        ]
    });

    it('should create a Layer', function () {
        expect(layer instanceof Layer).to.equal(true);
    });

    describe('#name)', function () {
        it('should return the name of a layer', function () {
            expect(layer.name).to.equal('test');
        });
    });

    describe('#image)', function () {
        it('should return the image of a layer', function () {
            expect(layer.image).to.equal('test/test');
        });
    });

    describe('#dataOnly', function () {
        it('should return if the layer is a data only layer that shouldn\'t be run', function () {
            expect(layer.dataOnly).to.equal(false);
        });
    });

    describe('#restart)', function () {
        it('should return if the layer should restart or not', function () {
            expect(layer.restart).to.equal(true);
            expect(layer.shouldRestart).to.equal(true);
        });
    });

    describe('#memLimit', function () {
        it('should return the memory limit of a layer as undefined if not defined', function () {
            var testComponent = new Layer('', {});

            expect(testComponent.memLimit).to.be.an('undefined');
            expect(testComponent.memoryLimit).to.be.an('undefined');
        });

        it('should return the memory limit of a layer', function () {
            expect(layer.memLimit).to.equal('1GB');
            expect(layer.memoryLimit).to.equal('1GB');
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
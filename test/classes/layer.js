"use strict";

var _ = require('lodash');
var expect = require('chai').expect;

var Link = require('../../inc/classes/link');
var Layer = require('../../inc/classes/layer');
var Volume = require('../../inc/classes/volume');
var VolumeFrom = require('../../inc/classes/volumefrom');
var Environment = require('../../inc/classes/environment');

describe('Layer', function () {
    var layer = new Layer({
        image: "test/test",
        dataOnly: false,
        restart: true,
        memLimit: "1g",
        command: "test some arguments --help",
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
            var testComponent = new Layer({});

            expect(testComponent.memLimit).to.be.an('undefined');
            expect(testComponent.memoryLimit).to.be.an('undefined');
        });

        it('should return the memory limit of a layer', function () {
            expect(layer.memLimit).to.equal('1g');
            expect(layer.memoryLimit).to.equal('1g');
        });
    });

    describe('#command', function () {
        it('should return the command of a layer', function () {
            expect(layer.command).to.equal('test some arguments --help');
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
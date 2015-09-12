"use strict";

var _ = require('lodash');
var expect = require('chai').expect;

var Link = require('../../inc/classes/link');
var Volume = require('../../inc/classes/volume');
var Component = require('../../inc/classes/layer');
var VolumeFrom = require('../../inc/classes/volumefrom');
var Environment = require('../../inc/classes/environment');

describe('Component', function () {
    var component = new Component({
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

    it('should create a Component', function () {
        expect(component instanceof Component).to.equal(true);
    });

    describe('#getImage()', function () {
        it('should return the image of a component', function () {
            expect(component.getImage()).to.equal('test/test');
        });
    });

    describe('#isDataOnly()', function () {
        it('should return if the component is a data only component that shouldn\'t be run', function () {
            expect(component.isDataOnly()).to.equal(false);
        });
    });

    describe('#shouldRestart()', function () {
        it('should return if the component should restart or not', function () {
            expect(component.shouldRestart()).to.equal(true);
        });
    });

    describe('#getMemoryLimit()', function () {
        it('should return the memory limit of a component as undefined if not defined', function () {
            var testComponent = new Component({});

            expect(testComponent.getMemoryLimit()).to.be.an('undefined');
        });

        it('should return the memory limit of a component', function () {
            expect(component.getMemoryLimit()).to.equal('1g');
        });
    });

    describe('#getCommand()', function () {
        it('should return the command of a component', function () {
            expect(component.getCommand()).to.equal('test some arguments --help');
        });
    });

    describe('#getLinks()', function () {
        it('should return the links of a component', function () {
            expect(component.getLinks()).to.be.an('array');
            expect(component.getLinks()[0] instanceof Link).to.equal(true);
        });
    });

    describe('#getVolumes()', function () {
        it('should return the volumes of a component', function () {
            expect(component.getVolumes()).to.be.an('array');
            expect(component.getVolumes()[0] instanceof Volume).to.equal(true);
        });
    });

    describe('#getVolumesFrom()', function () {
        it('should return the volumes of other containers for a component', function () {
            expect(component.getVolumesFrom()).to.be.an('array');
            //expect(component.getVolumesFrom()[0] instanceof VolumeFrom).to.equal(true);
        });
    });

    describe('#getEnvironment()', function () {
        it('should return the environment of a component', function () {
            expect(component.getEnvironment()).to.be.an('array');
            expect(component.getEnvironment()[0] instanceof Environment).to.equal(true);
        });
    });
});
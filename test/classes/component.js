var expect = require('chai').expect;

var Link = require('../../inc/classes/link');
var Volume = require('../../inc/classes/volume');
var Component = require('../../inc/classes/component');
var Environment = require('../../inc/classes/environment');

describe('Component', function () {
    var component = new Component({
        image: "test/test",
        restart: true,
        command: "test some arguments --help",
        links: [
            {}
        ],
        volumes: [
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

    describe('#shouldRestart()', function () {
        it('should return if the component should restart or not', function () {
            expect(component.shouldRestart()).to.equal(true);
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

    describe('#getEnvironment()', function () {
        it('should return the environment of a component', function () {
            expect(component.getEnvironment()).to.be.an('array');
            expect(component.getEnvironment()[0] instanceof Environment).to.equal(true);
        });
    });
});
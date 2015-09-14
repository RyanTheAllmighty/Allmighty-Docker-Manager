"use strict";

var expect = require('chai').expect;

var Application = require('../../inc/classes/application');
var Layer = require('../../inc/classes/layer');

describe('Application', function () {
    var application = new Application({
        name: 'Test Application',
        description: 'This is a test application!',
        layers: {
            test: {}
        }
    });

    it('should create an Application', function () {
        expect(application instanceof Application).to.equal(true);
    });

    describe('#name', function () {
        it('should return the name of the application', function () {
            expect(application.name).to.equal('test application');
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
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

    describe('#getName()', function () {
        it('should return the name of the application', function () {
            expect(application.getName()).to.equal('Test Application');
        });
    });

    describe('#getDescription()', function () {
        it('should return the description of the application', function () {
            expect(application.getDescription()).to.equal('This is a test application!');
        });
    });

    describe('#getLayers()', function () {
        it('should return all the layers of the application', function () {
            expect(application.getLayers().test instanceof Layer).to.equal(true);
        });
    });

    describe('#getLayer()', function () {
        it('should return a single layer of the application', function () {
            expect(application.getLayer('test') instanceof Layer).to.equal(true);
        });
    });
});
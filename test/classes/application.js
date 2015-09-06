var expect = require('chai').expect;

var Application = require('../../inc/classes/application');
var Component = require('../../inc/classes/component');

describe('Application', function () {
    var application = new Application({
        name: 'Test Application',
        description: 'This is a test application!',
        components: {
            test: {}
        }
    });

    it('should create an Application', function () {
        expect(application instanceof Application).to.equal(true);
    });

    describe('#getName()', function () {
        it('should return the name of the application', function () {
            expect(application.getName()).to.equal('Test Application');
            expect(application.name).to.equal('Test Application');
        });
    });

    describe('#getDescription()', function () {
        it('should return the description of the application', function () {
            expect(application.getDescription()).to.equal('This is a test application!');
            expect(application.description).to.equal('This is a test application!');
        });
    });

    describe('#getComponents()', function () {
        it('should return the components of the application', function () {
            expect(application.getComponents()).to.be.a('object');
            expect(application.getComponents().test instanceof Component).to.equal(true);
            expect(application.getComponent('test') instanceof Component).to.equal(true);
        });
    });
});
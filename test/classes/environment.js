var expect = require('chai').expect;

var Environment = require('../../inc/classes/environment');

describe('Environment', function () {
    var environment = new Environment({
        name: 'TEST',
        value: 'test'
    });

    it('should create an environnment', function () {
        expect(environment instanceof Environment).to.equal(true);
    });

    describe('#getName()', function () {
        it('should return the name of an environment', function () {
            expect(environment.getName()).to.equal('TEST');
        });
    });

    describe('#getValue()', function () {
        it('should return the value of an environment', function () {
            expect(environment.getValue()).to.equal('test');
        });
    });
});
"use strict";

var expect = require('chai').expect;

var Environment = require('../../inc/classes/environment');

describe('Environment', function () {
    var environment = new Environment({
        name: 'TEST',
        value: 'test'
    });

    it('should create an environment', function () {
        expect(environment instanceof Environment).to.equal(true);
    });

    describe('#name', function () {
        it('should return the name of an environment', function () {
            expect(environment.name).to.equal('TEST');
        });
    });

    describe('#value', function () {
        it('should return the value of an environment', function () {
            expect(environment.value).to.equal('test');
        });
    });
});
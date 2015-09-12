"use strict";

var expect = require('chai').expect;

var Component = require('../../inc/classes/component');

describe('Component', function () {
    var component = new Component('test');

    it('should create a Component', function () {
        expect(component instanceof Component).to.equal(true);
    });

    describe('#getName()', function () {
        it('should return the name of the component', function () {
            expect(component.getName()).to.equal('test');
        });
    });
});
"use strict";

var expect = require('chai').expect;

var Link = require('../../inc/classes/link');

describe('Link', function () {
    var linkWithName = new Link({
        "container": "testWithName",
        "name": "test"
    });

    var linkWithoutName = new Link({
        "container": "testWithoutName"
    });

    it('should create a link', function () {
        expect(linkWithName instanceof Link).to.equal(true);
        expect(linkWithoutName instanceof Link).to.equal(true);
    });

    describe('#container', function () {
        it('should return the container name for a link', function () {
            expect(linkWithName.container).to.equal('testWithName');
            expect(linkWithoutName.container).to.equal('testWithoutName');
        });
    });

    describe('#name', function () {
        it('should return the name of a link with a name', function () {
            expect(linkWithName.name).to.equal('test');
        });

        it('should return the name of a link without a name', function () {
            expect(linkWithoutName.name).to.equal('testWithoutName');
        });
    });
});
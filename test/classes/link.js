var expect = require('chai').expect;

var Link = require('../../inc/classes/link');

describe('Environment', function () {
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

    describe('#getContainer()', function () {
        it('should return the container name for a link', function () {
            expect(linkWithName.getContainer()).to.equal('testWithName');

            expect(linkWithoutName.getContainer()).to.equal('testWithoutName');
        });
    });

    describe('#getName()', function () {
        it('should return the name of a link with a name', function () {
            expect(linkWithName.getName()).to.equal('test');
        });
    });

    describe('#getName()', function () {
        it('should return the name of a link without a name', function () {
            expect(linkWithoutName.getName()).to.equal('testWithoutName');
        });
    });
});
"use strict";

var expect = require('chai').expect;

var VolumeFrom = require('../../inc/classes/volumeFrom');

describe('VolumeFrom', function () {
    var volume = new VolumeFrom({
        container: "test"
    });

    it('should create a VolumeFrom', function () {
        expect(volume instanceof VolumeFrom).to.equal(true);
    });

    describe('#getContainerName()', function () {
        it('should return the name of the container this volume is from', function () {
            expect(volume.getContainerName()).to.equal('test');
        });
    });
});
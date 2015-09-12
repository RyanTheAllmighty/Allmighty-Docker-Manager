"use strict";

var expect = require('chai').expect;

var Volume = require('../../inc/classes/volume');

describe('Volume', function () {
    var readWriteVolume = new Volume({
        host: "/test/readwrite",
        container: "/mnt/readwrite",
        readOnly: false
    });

    var readOnlyVolume = new Volume({
        host: "/test/readonly",
        container: "/mnt/readonly",
        readOnly: true
    });

    it('should create a read only Volume', function () {
        expect(readOnlyVolume instanceof Volume).to.equal(true);
        expect(readOnlyVolume.readOnly).to.equal(true);
    });

    it('should create a read write Volume', function () {
        expect(readWriteVolume instanceof Volume).to.equal(true);
        expect(readWriteVolume.readOnly).to.equal(false);
    });

    describe('#readOnly', function () {
        it('should return if the volume is read only', function () {
            expect(readWriteVolume.readOnly).to.equal(false);
            expect(readOnlyVolume.readOnly).to.equal(true);
        });
    });

    describe('#host', function () {
        it('should return the path to the volume on the host', function () {
            expect(readOnlyVolume.host).to.equal('/test/readonly');
            expect(readOnlyVolume.hostMount).to.equal('/test/readonly');
        });
    });

    describe('#container', function () {
        it('should return the path to the volume within the container', function () {
            expect(readOnlyVolume.container).to.equal('/mnt/readonly');
            expect(readOnlyVolume.containerMount).to.equal('/mnt/readonly');
        });
    });
});
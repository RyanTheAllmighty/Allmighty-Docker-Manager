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
        expect(readOnlyVolume.isReadOnly()).to.equal(true);
    });

    it('should create a read write Volume', function () {
        expect(readWriteVolume instanceof Volume).to.equal(true);
        expect(readWriteVolume.isReadOnly()).to.equal(false);
    });

    describe('#isReadOnly()', function () {
        it('should return if the volume is read only', function () {
            expect(readWriteVolume.isReadOnly()).to.equal(false);
            expect(readOnlyVolume.isReadOnly()).to.equal(true);
        });
    });

    describe('#getHostMount()', function () {
        it('should return the path to the volume on the host', function () {
            expect(readOnlyVolume.getHostMount()).to.equal('/test/readonly');
        });
    });

    describe('#getContainerMount()', function () {
        it('should return the path to the volume within the container', function () {
            expect(readOnlyVolume.getContainerMount()).to.equal('/mnt/readonly');
        });
    });
});
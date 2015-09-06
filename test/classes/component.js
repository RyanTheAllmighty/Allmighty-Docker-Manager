var expect = require('chai').expect;

var Component = require('../../inc/classes/component');
var Volume = require('../../inc/classes/volume');

describe('Component', function () {
    var component = new Component({
        image: "test/test",
        restart: true,
        command: "test some arguments --help",
        volumes: [
            {
                host: "/test/readwrite",
                container: "/mnt/readwrite",
                readOnly: false
            },
            {
                host: "/test/readonly",
                container: "/mnt/readonly",
                readOnly: true
            }
        ]
    });

    it('should create a Component', function () {
        expect(component instanceof Component).to.equal(true);
    });

    describe('#getImage()', function () {
        it('should return the image of a component', function () {
            expect(component.getImage()).to.equal('test/test');
            expect(component.image).to.equal('test/test');
        });
    });

    describe('#getVolumes()', function () {
        it('should return the volumes of a component', function () {
            expect(component.getVolumes()).to.be.a('object');
            expect(component.getVolumes()[0] instanceof Volume).to.equal(true);
            expect(component.getVolumes()[1] instanceof Volume).to.equal(true);
        });
    });
});
var expect = require('chai').expect;

var Application = require('../inc/classes/application');
var Component = require('../inc/classes/component');

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

var app = new Application({
    name: 'Test Application',
    description: 'This is a test application!',
    components: {
        test: component
    }
});

describe('Application', function () {
    it('should create an Application', function () {
        expect(app instanceof Application).to.equal(true);
    });

    describe('#getName()', function () {
        it('should return the name of the application', function () {
            expect(app.getName()).to.equal('Test Application');
        });
    });

    describe('#getDescription()', function () {
        it('should return the description of the application', function () {
            expect(app.getDescription()).to.equal('This is a test application!');
        });
    });

    describe('#getComponents()', function () {
        it('should return the components of the application', function () {
            expect(app.getComponents()).to.be.a('object');
            expect(app.getComponents().test instanceof Component).to.equal(true);
            expect(app.getComponent('test') instanceof Component).to.equal(true);
        });
    });
});

describe('Component', function () {
    it('should create a Component', function () {
        expect(component instanceof Component).to.equal(true);
    });

    describe('#getImage()', function () {
        it('should return the image of the component', function () {
            expect(component.getImage()).to.equal('test/test');
        });
    });
});
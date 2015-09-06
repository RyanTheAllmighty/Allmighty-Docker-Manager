var assert = require("chai").assert;

var Application = require('../inc/classes/application');

var app = new Application({
    name: 'Test Application',
    description: 'This is a test application!'
});

describe('Application', function () {
    describe('#getName()', function () {
        it('should return the name of the application', function () {
            assert.equal('Test Application', app.getName());
        });
    });

    describe('#getDescription()', function () {
        it('should return the description of the application', function () {
            assert.equal('This is a test application!', app.getDescription());
        });
    });
});
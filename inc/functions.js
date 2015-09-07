// Require all the external modules
var fs = require('fs');
var _ = require('lodash');
var path = require('path');

// Noe our applications specific classes
var Link = require('./classes/link');
var Layer = require('./classes/layer');
var Volume = require('./classes/volume');
var Component = require('./classes/component');
var VolumeFrom = require('./classes/volumeFrom');
var Application = require('./classes/application');
var Environment = require('./classes/environment');

module.exports = function (settings) {
    return {
        loadComponents: function () {
            console.log('Loading Components!');

            var componentNames = fs.readdirSync(this.getBuildsDirectory()).filter(function (file) {
                return fs.statSync(path.join(this.getBuildsDirectory(), file)).isDirectory();
            }, this);

            var components = {};

            _.forEach(componentNames, function (name) {
                components[name] = new Component(name);
            });

            return components;
        },
        loadApplications: function () {
            console.log('Loading Applications!');

            var applicationNames = _.map(fs.readdirSync(this.getApplicationsDirectory()).filter(function (file) {
                return file.substr(-5) == '.json';
            }), function (app) {
                return app.substr(0, app.length - 5);
            });

            var applications = {};

            _.forEach(applicationNames, function (name) {
                applications[name] = new Application(name);
            });

            return applications;
        },
        getBuildsDirectory: function () {
            return path.resolve(settings.directories.builds);
        },
        getApplicationsDirectory: function () {
            return path.resolve(settings.directories.applications);
        }
    }
};
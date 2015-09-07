// Require all the external modules
var fs = require('fs');
var _ = require('lodash');
var path = require('path');
var async = require('async');
var Docker = require('dockerode');
var spawn = require('child_process').spawn;

// Noe our applications specific classes
var Link = require('./classes/link');
var Layer = require('./classes/layer');
var Volume = require('./classes/volume');
var Component = require('./classes/component');
var VolumeFrom = require('./classes/volumeFrom');
var Application = require('./classes/application');
var Environment = require('./classes/environment');

// Now require our settings json file
var settings = require('../settings.json');

// Then grab our functions file and pass it our settings
var functions = require('./functions')(settings);

// Initialize our Docker socket object
var docker = new Docker({socketPath: settings.dockerSocket});

// Now our objects to store our components and applications in
var components = {};
var applications = {};

module.exports = function () {
    return {
        load: function () {
            applications = functions.loadComponents();
            components = functions.loadApplications();
        },
        getApplications: function () {
            return applications;
        },
        getComponents: function () {
            return components;
        }
    }
};
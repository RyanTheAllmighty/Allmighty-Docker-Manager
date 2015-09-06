var docker = require('../docker');

var fs = require('fs');
var _ = require('lodash');
var path = require('path');
var merge = require('merge');

var directories = [
    '/docker/',
    '/docker/certs/',
    '/docker/data/',
    '/docker/logs/',
    '/docker/nginx-conf/',
    '/docker/sites/
    '/docker/sites/
    '/docker/sites/
    '/docker/sites/
    '/docker/sites/
    '/docker/sites/
    '/docker/sites/
    '/docker/sites/
    '/docker/sites/
    '/docker/sites/
];

var args;

// The options for this command, if any, and their defaults
var options = {
    quiet: false
};

module.exports.init = function (arguments, callback) {
    args = arguments;
    options = merge(options, args);

    callback();
};

module.exports.run = function (callback) {
    setupDirectories();

    callback();
};

function setupDirectories() {
    if (!options.quiet) {
        console.log('Setting up the directories needed!');
    }

    _.forEach(directories, function (directory) {
        if (!fs.existsSync(directory)) {
            if (!options.quiet) {
                console.log('Creating directory ' + directory);
            }
            fs.mkdirSync(directory);
        }
    });
}
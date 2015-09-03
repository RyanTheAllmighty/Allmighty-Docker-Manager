var docker = require('../docker');

var fs = require('fs');
var _ = require('lodash');
var path = require('path');

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

module.exports.run = function (arguments, callback) {
    setupDirectories();

    callback({
        code: 0
    });
};

function setupDirectories() {
    console.log('Setting up the directories needed!');

    _.forEach(directories, function (directory) {
        if (!fs.existsSync(directory)) {
            console.log('Creating directory ' + directory);
            fs.mkdir(directory);
        }
    });
}
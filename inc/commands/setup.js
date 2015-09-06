var docker = require('../docker');

var fs = require('fs');
var _ = require('lodash');
var path = require('path');
var merge = require('merge');
var mkdirp = require('mkdirp');

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

    _.forEach(docker.getApplicationsSync(), function (application) {
        _.forEach(application.directories, function (directory) {
            var thisPath = path.join('/docker', directory.path);

            if (!fs.existsSync(thisPath)) {
                if (!options.quiet) {
                    console.log('Creating directory ' + thisPath);
                }

                mkdirp.sync(thisPath);
            }
        });
    });
}
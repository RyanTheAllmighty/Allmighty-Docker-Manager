var fs = require('fs');
var path = require('path');
var spawn = require('child_process').spawn;

module.exports.settings = require('../settings.json');

module.exports.getBuildsDirectory = function(name) {
    return path.resolve(module.exports.settings.directories.builds);
};

module.exports.getBuildDirectory = function(name) {
    return path.join(module.exports.settings.directories.builds, name);
};

module.exports.getDockerBuildFile = function(name) {
    return path.join(module.exports.getBuildDirectory(name), 'Dockerfile');
};

module.exports.isBuildable = function(name, callback) {
    fs.exists(module.exports.getBuildDirectory(name), function (exists) {
        if (!exists) {
            callback(false);
        }

        fs.exists(module.exports.getDockerBuildFile(name), callback);
    });
};

module.exports.spawnDockerProcess = function(arguments, callback) {
    var process = spawn(module.exports.settings.dockerLocation, arguments);

    process.stdout.on('data', function (data) {
        console.log(data.toString());
    });

    process.stderr.on('data', function (data) {
        console.error(data.toString());
    });

    process.on('close', function (code) {
        callback({
            code: code
        });
    });
};
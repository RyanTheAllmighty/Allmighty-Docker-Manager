var settings = require('../settings.json');

var _ = require('lodash');
var fs = require('fs');
var path = require('path');
var merge = require('merge');
var spawn = require('child_process').spawn;
var sprintf = require("sprintf-js").sprintf;

function getBuildsDirectory(name) {
    return path.resolve(settings.directories.builds);
}

function getBuildDirectory(name) {
    return path.join(settings.directories.builds, name);
}

function getDockerBuildFile(name) {
    return path.join(getBuildDirectory(name), 'Dockerfile');
}

function isBuildable(name, callback) {
    fs.exists(getBuildDirectory(name), function (exists) {
        if (!exists) {
            callback(false);
        }

        fs.exists(getDockerBuildFile(name), callback);
    });
}

module.exports.build = function (name, opts, callback) {
    if (opts && !callback) {
        callback = opts;
        opts = {};
    }

    var options = merge({
        noCache: false
    }, opts);

    isBuildable(name, function (buildable) {
        console.log(options);
        if (!buildable) {
            callback({
                code: 1,
                error: 'Cannot build ' + name + '!'
            });
        }

        var arguments = [];

        arguments.push('build');
        arguments.push('--rm');

        if (options.noCache) {
            arguments.push('--no-cache=true');
        }

        arguments.push(sprintf('--tag="%s"', 'a-repo/' + name));
        arguments.push(getBuildDirectory(name));

        var process = spawn(settings.dockerLocation, arguments);

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
    });
};

module.exports.buildAll = function (callback) {
    var builds = fs.readdirSync(getBuildsDirectory()).filter(function (file) {
        return fs.statSync(path.join(getBuildsDirectory(), file)).isDirectory();
    });

    _.forEach(builds, function (name) {
        module.exports.build(name, function (res) {
            // Check for failure
            if (res.code != 0) {
                // If we failed on a build, don't run the rest and callback with that result
                callback(res);
            }

            // Else we're all good and can continue to the next build
        });
    });
};
var fs = require('fs');
var _ = require('lodash');
var path = require('path');
var async = require('async');
var Docker = require('dockerode');
var settings = require('../settings.json');
var spawn = require('child_process').spawn;
var docker = new Docker({socketPath: settings.dockerSocket});

module.exports.settings = settings;

module.exports.getBuildsDirectory = function () {
    return path.resolve(module.exports.settings.directories.builds);
};

module.exports.getApplicationsDirectory = function () {
    return path.resolve(module.exports.settings.directories.applications);
};

module.exports.getBuildDirectory = function (name) {
    return path.join(module.exports.settings.directories.builds, name);
};

module.exports.getDockerBuildFile = function (name) {
    return path.join(module.exports.getBuildDirectory(name), 'Dockerfile');
};

module.exports.getDockerComposeYML = function (name) {
    return path.join(module.exports.getApplicationsDirectory(), name + '.yml');
};

module.exports.isBuildable = function (name, callback) {
    fs.exists(module.exports.getBuildDirectory(name), function (exists) {
        if (!exists) {
            callback(false);
        }

        fs.exists(module.exports.getDockerBuildFile(name), callback);
    });
};

module.exports.getRunningContainerNames = function (callback) {
    docker.listContainers({all: false}, function (err, containers) {
        if (err) {
            return callback(err);
        }

        var names = _.reduceRight(_.map(containers, 'Names'), function (flattened, other) {
            return flattened.concat(other);
        });

        names = _.map(names, function (name) {
            return name.substring(1);
        });

        names = _.filter(names, function (name) {
            return !name.match(/\//g);
        });

        callback(null, names);
    });
};

module.exports.isRunning = function (name, callback) {
    module.exports.getRunningContainerNames(function (err, containers) {
        if (err) {
            console.error(err);

            return callback(false, name);
        }

        var offline = [];

        if (name.constructor === Array) {
            _.forEach(name, function (n) {
                if (_.indexOf(containers, n) == -1) {
                    offline.push(n);
                }
            });
        } else {
            if (_.indexOf(containers, name) == -1) {
                offline.push(name);
            }
        }

        callback(offline.length == 0, offline);
    })
};

module.exports.spawnDockerProcess = function (arguments, callback) {
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

module.exports.spawnDockerComposeProcess = function (arguments, callback) {
    var process = spawn(module.exports.settings.dockerComposeLocation, arguments);

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

module.exports.cleanEverything = function (callback) {
    docker.listContainers({all: true}, function (err, containers) {
        if (err) {
            return callback({
                code: 1,
                error: err
            })
        }

        async.each(containers, function (containerInfo, next) {
            docker.getContainer(containerInfo.Id).stop(function (err) {
                if (err && err.statusCode != 304) {
                    return next(err);
                }

                docker.getContainer(containerInfo.Id).remove(next);
            });
        }, function (err) {
            if (err) {
                return callback({
                    code: 1,
                    error: err
                })
            }

            docker.listImages(function (err, images) {
                if (err) {
                    return callback({
                        code: 1,
                        error: err
                    })
                }

                async.each(images, function (imageInfo, next) {
                    docker.getImage(imageInfo.Id).remove(next);
                }, function (err) {
                    if (err) {
                        return callback({
                            code: 1,
                            error: err
                        })
                    }

                    callback({
                        code: 0
                    })
                });
            });
        });
    });
};
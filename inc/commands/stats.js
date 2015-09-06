var docker = require('../docker');

var merge = require('merge');

var args;
var containers;

// The options for this command, if any, and their defaults
var options = {
    quiet: false
};

module.exports.init = function (arguments, callback) {
    args = arguments;
    options = merge(options, args);

    docker.getRunningContainerNames(function (err, res) {
        if (err) {
            return callback({
                error: err
            });
        }

        if (res.length == 0) {
            return callback({
                error: 'There are no running containers to get the stats of!'
            });
        }

        containers = res;

        callback();
    });
};

module.exports.run = function (callback) {
    docker.spawnDockerProcess(['stats', '--no-stream'].concat(containers), callback);
};
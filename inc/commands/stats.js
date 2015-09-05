var docker = require('../docker');

var _ = require('lodash');
var sprintf = require("sprintf-js").sprintf;

module.exports.run = function (arguments, callback) {
    var args = arguments;

    docker.getRunningContainerNames(function (err, containers) {
        if (err) {
            return callback({
                code: 1,
                error: err
            })
        }

        if (containers.length == 0) {
            return callback({
                code: 1,
                error: 'There are no running containers to get the stats of!'
            });
        }

        docker.spawnDockerProcess(['stats', '--no-stream'].concat(containers), callback);
    });
};
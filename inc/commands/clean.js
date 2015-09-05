var docker = require('../docker');

module.exports.run = function (arguments, callback) {
    docker.cleanEverything(callback);
};
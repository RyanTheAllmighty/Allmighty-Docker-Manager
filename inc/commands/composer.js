var docker = require('../docker');

var fs = require('fs');
var _ = require('lodash');
var path = require('path');
var async = require('async');
var merge = require('merge');
var sprintf = require("sprintf-js").sprintf;

module.exports.run = function (arguments, callback) {
    // Check if we have the correct arguments or not
    if (!arguments._ || arguments._.length == 0) {
        callback({
            code: 1,
            error: 'No arguments were passed to this command!'
        });
    }

    // Were good so lets run composer
    composer(arguments._.shift(), arguments, function (res) {
        if (res.code != 0) {
            console.log(res.error);
        }

        callback(res);
    });
};

function composer(name, opts, callback) {
    var options = merge({}, opts);

    var arguments = [];

    arguments.push('run');
    arguments.push('--volumes-from');
    arguments.push(sprintf('%s_data', name));
    arguments.push('--name');
    arguments.push(sprintf('%s_composer', name));
    arguments.push('--rm');
    arguments.push('-w="/mnt/site/"');
    arguments.push(sprintf('%s/php', docker.settings.repositoryURL));

    arguments.push('composer');
    arguments.push('--ansi');

    docker.spawnDockerProcess(arguments.concat(opts._), callback);
}
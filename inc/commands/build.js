var docker = require('../docker');

module.exports.run = function (arguments, callback) {
    // Cheeck if we have any more arguments
    if (arguments._ && arguments._.length > 0) {
        // Yup, so lets build this single component
        docker.build(arguments._.shift(), arguments, function (res) {
            if (res.code != 0) {
                console.log(res.error);
            }

            callback(res);
        });
    } else {
        docker.buildAll(arguments, function (res) {
            if (res.code != 0) {
                console.log(res.error);
            }

            callback(res);
        });
    }
};
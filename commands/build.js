var _ = require('lodash');

module.exports.run = function (arguments) {
    var buildTarget = 'all';

    // Cheeck if we have any more arguments
    if (arguments._.length > 0) {
        // Yup, so lets see if we can build that
        buildTarget = arguments._.shift();

        if()
    }

    return {
        code: 0
    }
};
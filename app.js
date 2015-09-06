var fs = require('fs');

// Parse the arguments passed in
var arguments = require('minimist')(process.argv.slice(2));
arguments._raw = process.argv.slice(2);

if (arguments._.length == 0) {
    console.error('No arguments were passed in!');
    process.exit(1);
}

// The action we're taking
var action = arguments._.shift();

// Check if that was the only element, if so remove it from the array
if (arguments._.length == 0) {
    delete arguments._;
}

// Check the action is only letters
if (!/^[a-zA-z]+$/.test(action)) {
    console.error('Invalid first argument passed in!');
    process.exit(1);
}

// The file of the possible command
var commandFile = './inc/commands/' + action + '.js';

// Check the js file exists in the command directory
if (!fs.existsSync(commandFile)) {
    console.error('No command found for ' + action + '!');
    process.exit(1);
}

// The command we want to run
var result = require(commandFile).run(arguments, function (res) {
    if (res && res.error) {
        console.error(res.error);
    }

    process.exit(res.code);
});
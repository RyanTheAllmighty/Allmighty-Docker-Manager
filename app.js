"use strict";

var fs = require('fs');

// Load the brain in for the application
var brain = require('./inc/brain');
brain.load();

// Parse the arguments passed in
var passedArgs = require('minimist')(process.argv.slice(2));
passedArgs._raw = process.argv.slice(2);

if (passedArgs._.length == 0) {
    console.error('No arguments were passed in!');
    process.exit(1);
}

// The action we're taking
var action = passedArgs._.shift();

// Check if that was the only element, if so remove it from the array
if (passedArgs._.length == 0) {
    delete passedArgs._;
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

// This is the command we want to run
var command = require(commandFile);

// First we need to initialize it with the arguments passed in to do some sanity checks and processing
command.init(passedArgs, function (res) {
    if (res && res.error) {
        console.error(res.error);
        return process.exit(1);
    }

    // Then we run it with a callback with the result
    command.run(function (err, res) {
        if (err) {
            console.error(err);

            return process.exit(1);
        }

        if (res) {
            console.log(res);
        }

        process.exit(0);
    });
});

/**
 * This is a callback for any errors and results from running a command.
 *
 * @callback App~commandRunCallback
 * @param {Object|undefined} err - The error (if any) returned from this command
 * @param {string|undefined} res - The response (if any) returned from this command
 */
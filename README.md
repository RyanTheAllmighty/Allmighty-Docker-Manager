# Allmighty Docker Manager (ADM)
Allmighty Docker Manager (ADM) is a small utility written in NodeJS which interacts with Docker to manage groups of docker containers.

This utility deals with 2 concepts. Applications and Components.

## Applications
Applications are defined in the applications folder and are json files.

Each application represents a single application (be it a website, monitoring solution or other) that is to be run with Docker.

Each application contains one or more components which is explained more below.

An application is saved as a json file with the filename being the applications internal name. For instance for a application for a website of 'www.baloonsaredeadly.com' you might have a
balloonsaredeadly.json file in the applications folder.

For an example of the json file needed by this utility, please see the samples directory.

## Components
Components are defined in the components folder and are nothing more than simple Docker build folders.

For instance if you have a component for PHP, simply make a folder in the components directory called PHP and pop your Dockerfile in that directory and anything else needed to build the image.

There are no examples of this, as they're no different than your standard build directories you'd make for Docker.

# Using The Application

## Installation
To install this simply run the following in your console:

```
npm install -g allmighty-docker-manager
```

Once done it will give access to the 'adm' command. Simply run this command in any folder with your settings file (example provided in the repo) and applications and components.

Please note that this application was created using NodeJS version 4.2.2 and may or may not work on any versions of NodeJS earlier. This application uses ES6 features, so turning on harmony for older
versions may or may not work.


## Note About Commands
All the commands for this are run through NodeJS with the app.js file.

You run the commands like below:

```
adm <command name> <command option> --<switch> --<argument>=<value>
```

There can be multiple command names as well as command options. More details will be in the sections below.

You may wish to alias this to something to make it less work to write out. But that's completely up to you, and will work either way.

There are commands which will target either a single application/component, or there is a command which will target many or possibly all of the applications/components.

In the cases where more than one application/component is targeted, then the process is run synchronously, meaning one at a time.

If you wish to run things asynchronously, then you can add on the --async argument to the command. For instance:

```
adm build --async
```

## Getting Started
To get started simply make a copy of the settings.json file in the sample directory and save it to a directory you'll run the application from and fill in the details.

Also make sure you've setup your applications and components as needed.

Then to get setup simply run the below command in the directory you saved them to:

```
adm setup
```

This will create the necessary directories in the directory you've specified in the settings.json to be the storage directory.

## Getting Images
There are multiple ways to get the images needed to run things, you can build them manually by running the command:

```
adm build
```

When building you can optionally provide a version to which if provided will set the tag of the resulting image to the version provided. The version will also be added as a build argument (Docker 1.9)
so you can access it from your Dockerfile using 'ARG VERSION' if you wish to use it.

```
adm build component --version=1.0.0
```

If no version is provided then it will be tagged as 'latest' and no build arguments will be passed into the Docker build process **UNLESS** there is a utility file (see section below for info) in that
components folder with a method called 'getLatestVersion' which returns a promise which resolves to the version number to use as if you'd passed it in. You also cannot specify a version unless you're
building only one component.

If you wish to get a list of versions available for a component you can run the build command with the --versions option as per below:

```
adm build component --versions
```

This will list all the versions available for the given component as per what is in the adm-util.js file for the component if it exists.

Alternatively you can pull down the images from the set repository (set in the settings.json file) by running:

```
adm pull
```

As with all the above commands, you can add a single applications name to the end of the command to just affect that one application. For instance to build the application called 'test' you'd run:

```
adm build test
```

## Running
To get everything up and running, simply run the below command:

```
adm up
```

To stop the containers you can run the following command to stop the containers:

```
adm down
```

If you wish to restart the containers, simply run:

```
adm restart
```

As with all the above commands, you can add a single applications name to the end of the command to just affect that one application. For instance to restart the application called 'test' you'd run:

```
adm restart test
```

## Monitoring
If you want to see a real time web interface as to what's going on, what processes are consuming the most ram/cpu with alot of details, then you can run the below command, with the optional port to
listen for requests on:

```
adm monitor --port=8000
```

The default port for the monitor to run on is 8080 and in the example above we're running it on port 8000. Just pass your web browser to port 8000 of the machine's IP and you'll get into the
container's web interface running [cAdvisor](https://github.com/google/cadvisor)

## Environment Variables
There are very few environment variables that ADM takes into consideration, but they are listed below:

### ADM_STORAGE_PATH
This allows you to specify where your application and components folders are, as well as your settings.json. This is useful if you're running the tool from a different directory to where those are
stored.

Example:

```
export ADM_STORAGE_PATH=/path/to/folder
```

## Command Line Completion
ADM provides command line completion built into the application.

The command line completion only works with Bash or zsh unix shell's.

To activate command line completion simply type the following:

```
. <(adm completion)
```

If you want to install it so it's always available then you can run one of the following:

```
adm completion >> ~/.bashrc
adm completion >> ~/.zshrc
```

This will add the completion to your .bashrc or .zshrc files.

## Application Utility Files
Application utility files are single JS files named adm-util.js in a applications folder. It's job is to provide simple utility commands to use during any interaction with applications.

The file should simply export methods you need to be available. A sample is included below with information about the methods.

```js
(function () {
    'use strict';

    module.exports = {
        /**
         * An array of modules we want to be passed. These can take the form of a simple string or an object with the key being the name to export it as.
         *
         * For instance {_: 'lodash'} will provide a modules._ with the required module called lodash.
         */
        modules: ['request', {_: 'lodash'}],
        /**
         * This runs before starting the application and is run before any container is created or brung up.
         *
         * @param {Application} application - This is the application that is being brought online
         * @param {Object} [modules] - This is an object of the requested required in modules (if any)
         * @returns {Promise} - Resolves when done. A reject will stop the application from coming up
         */
        preUp: function (application, modules) {
            return new Promise(function (resolve, reject) {
                resolve();
            });
        },
        /**
         * This runs before stopping the application and is run before any container is brung down.
         *
         * @param {Application} application - This is the application that is being brought online
         * @param {Object} [modules] - This is an object of the requested required in modules (if any)
         * @returns {Promise} - Resolves when done. A reject will stop the application from coming down
         */
        preDown: function (application, modules) {
            return new Promise(function (resolve, reject) {
                resolve();
            });
        }
    };
})();
```

## Component Utility Files
Component utility files are single JS files named adm-util.js in a components folder. It's job is to provide simple utility commands to use during any interaction with components.

The file should simply export methods you need to be available. A sample is included below with information about the methods.

```js
(function () {
    'use strict';

    module.exports = {
        /**
         * An array of modules we want to be passed. These can take the form of a simple string or an object with the key being the name to export it as.
         *
         * For instance {_: 'lodash'} will provide a modules._ with the required module called lodash.
         */
        modules: ['request', {_: 'lodash'}],
        /**
         * This gets the latest version of this component for use in the build process as a VERSION build argument and also as the tag.
         *
         * @param {Object} [modules] - This is an object of the requested required in modules (if any)
         * @returns {Promise} - Resolves with a String version else will reject with an Error object
         */
        getLatestVersion: function (modules) {
            return new Promise(function (resolve, reject) {
                return resolve('1.2.3');
            });
        },
         /**
          * This gets the an array of all the available versions of this component.
          *
          * @param {Object} options - This is an object of options passed from the command line
          * @param {Object} [modules] - This is an object of the requested required in modules (if any)
          * @returns {Promise} - Resolves with a String version else will reject with an Error object
          */
         getAvailableVersions: function (options, modules) {
             return new Promise(function (resolve, reject) {
                return resolve(['1.2.3', '1.2.4']);
             });
         }
    };
})();
```

# Development

## Environment
This application was created, tested and used with NodeJS 4.2.2.

This provides access to use ECMAScript 6. While it should work fine on newer versions of NodeJS, older versions may have issues.

## Testing & Linting
To run this applications tests and linter, simply install Gulp globally with the below command:

```
npm install -g gulp
```

Then run the following command in the directory this repository was cloned into:

```
gulp
```

The gulpfile gives access to a few methods shown below:

- jscs: Runs the JSCS tool to check JS code.
- jshint: Runs the JSHint tool to check JS code.
- test: Runs the mocha tests.
- style: Runs the jscs and jshint tasks to check JS code.
- watch: Runs all 3 main tasks and then watches for file changes to rerun those tasks constantly as files are changed.

By default Gulp is set to run the jscs, jshint and test tasks when no arguments are provided to it.
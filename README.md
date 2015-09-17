# Allmighty Docker Manager (ADM)
Allmighty Docker Manager (ADM) is a small utility written in NodeJS which interacts with Docker to manage groups of docker containers.

This utility deals with 2 concepts. Applications and Components.

## Applications
Applications are defined in the applications folder and are json files.

Each application represents a single application (be it a website, monitoring solution or other) that is to be run with Docker.

Each application contains one or more components which is explained more below.

An application is saved as a json file with the filename being the applications internal name. For instance for a application for a website of 'www.baloonsaredeadly.com' you might have a balloonsaredeadly.json file in the applications folder.

For an example of the json file needed by this utility, please see the samples directory.

## Components
Components are defined in the components folder and are nothing more than simple Docker build folders.

For instance if you have a component for PHP, simply make a folder in the components directory called PHP and pop your Dockerfile in that directory and anything else needed to build the image.

There are no examples of this, as they're no different than your standard build directories you'd make for Docker.

# Environment
This application was created, tested and used with NodeJS 4.0.0.

This provides access to use ECMAScript 6. While it should work fine on newer versions of NodeJS, older versions may have issues.

# Testing & Linting
To run this applications tests and linter, simply install Grunt globally with the below command:

```
npm install -g grunt-cli
```

Then run the following command in the directory this repository was cloned into:

```
grunt
```

# Note About Commands
All the commands for this are run through NodeJS with the app.js file.

You run the commands like below:

```
node app.js <command name> <command option> --<switch> --<argument>=<value>
```

There can be multiple command names as well as command options. More details will be in the sections below.

You may wish to alias this to something to make it less work to write out. But that's completely up to you, and will work either way.

There are commands which will target either a single application/component, or there is a command which will target many or possibly all of the applications/components.

In the cases where more than one application/component is targeted, then the process is run synchronously, meaning one at a time.

If you wish to run things asynchronously, then you can add on the --async argument to the command. For instance:

```
node app.js build --async
```

# Getting Started
To get started simply make a copy of the settings.json.example file and save it as settings.json and fill in the details.

Also make sure you've setup your applications and components as needed.

Then to get setup simply run the below command in the directory this has been cloned to:

```
node app.js setup
```

This will create the necessary directories in the directory you've specified in the settings.json to be the storage directory.

# Getting Images
There are multiple ways to get the images needed to run things, you can build them manually by running the command:

```
node app.js build
```

Alternatively you can pull down the images from the set repository (set in the settings.json file) by running:

```
node app.js pull
```

As with all the above commands, you can add a single applications name to the end of the command to just affect that one application. For instance to build the application called 'test' you'd run:

```
node app.js build test
```

# Running
To get everything up and running, simply run the below command:

```
node app.js up
```

To stop the containers you can run the following command to stop the containers:

```
node app.js down
```

If you wish to restart the containers, simply run:

```
node app.js restart
```

As with all the above commands, you can add a single applications name to the end of the command to just affect that one application. For instance to restart the application called 'test' you'd run:

```
node app.js restart test
```

# Monitoring
If you want to see a real time web interface as to what's going on, what processes are consuming the most ram/cpu with alot of details, then you can run the below command, with the optional port to listen for requests on:

```
node app.js monitor --port=8000
```

The default port for the monitor to run on is 8080 and in the example above we're running it on port 8000. Just pass your web browser to port 8000 of the machine's IP and you'll get into the container's web interface running [cAdvisor](https://github.com/google/cadvisor)
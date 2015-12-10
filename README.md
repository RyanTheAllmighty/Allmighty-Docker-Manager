# Allmighty Docker Manager (ADM)
[![Build Status](https://img.shields.io/travis/RyanTheAllmighty/Allmighty-Docker-Manager.svg?style=flat-square)](https://travis-ci.org/RyanTheAllmighty/Allmighty-Docker-Manager)
[![NPM Downloads](https://img.shields.io/npm/dt/allmighty-docker-manager.svg?style=flat-square)](https://www.npmjs.com/package/allmighty-docker-manager)
[![NPM Version](https://img.shields.io/npm/v/allmighty-docker-manager.svg?style=flat-square)](https://www.npmjs.com/package/allmighty-docker-manager)
[![Issues](https://img.shields.io/github/issues/RyanTheAllmighty/Allmighty-Docker-Manager.svg?style=flat-square)](https://github.com/RyanTheAllmighty/Allmighty-Docker-Manager/issues)
[![License](https://img.shields.io/badge/license-GPLv3-blue.svg?style=flat-square)](https://raw.githubusercontent.com/RyanTheAllmighty/Allmighty-Docker-Manager/master/LICENSE)

Allmighty Docker Manager (ADM for short) is a command line application written in NodeJS which manages Docker containers for a set of applications defined by the user.

## Install
This package is meant to be installed globally on your system with NPM:

```
npm install -g allmighty-docker-manager
```

Once installed you'll have access to the `adm` command and can then visit the [Getting Started](https://github.com/RyanTheAllmighty/Allmighty-Docker-Manager/wiki/getting-started) section in the wiki to get started configuring Allmighty Docker Manager.

## Documentation
All the documentation for Allmighty Docker manager is available on the [wiki](https://github.com/RyanTheAllmighty/Allmighty-Docker-Manager/wiki).

## Support
If you're having issues with Allmighty Docker Manager, please feel free to check the [troubleshooting wiki page](https://github.com/RyanTheAllmighty/Allmighty-Docker-Manager/wiki/troubleshooting) for a solution [open an issue](https://github.com/RyanTheAllmighty/Allmighty-Docker-Manager/issues/new)

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

## Coding standards & styling guidelines
Please see the [STYLE.md](https://github.com/RyanTheAllmighty/Allmighty-Docker-Manager/blob/master/STYLE.md) file for coding standards and style guidelines.

## License
This work is licensed under the GNU General Public License v3.0. To view a copy of this license, visit http://www.gnu.org/licenses/gpl-3.0.txt.
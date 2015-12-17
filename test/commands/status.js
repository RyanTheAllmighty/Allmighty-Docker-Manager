/*
 * Allmighty Docker Manager - https://github.com/RyanTheAllmighty/Allmighty-Docker-Manager
 * Copyright (C) 2015 RyanTheAllmighty
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

(function () {
    'use strict';

    let chai = require('chai');
    let expect = require('chai').expect;

    chai.use(require('chai-as-promised'));

    let Command = require('../../inc/commands/status');

    let defaultOptions = global.parseArgs();

    describe('Status', function () {
        let write, log, output = '';

        beforeEach(function () {
            output = '';
            write = process.stdout.write;
            log = console.log;

            // our stub will concatenate any output to a string
            process.stdout.write = console.log = function (s) {
                output += s;
            };
        });

        afterEach(function () {
            process.stdout.write = write;
            console.log = log;
        });

        describe('#init', function () {
            it('should initialize without issue with no applications passed in', function () {
                return Command.init(defaultOptions);
            });

            it('should initialize without issue with an application name passed', function () {
                return Command.init(global.parseArgs('application'));
            });

            it('should cause an issue when a non existing application is passed in', function () {
                return expect(Command.init(global.parseArgs('noexist'))).to.eventually.be.rejectedWith('Error: No application exists called "noexist"!');
            });
        });

        describe('#run', function () {
            it('should run without issue', function () {
                return Command.init(defaultOptions).then(Command.run).then(function () {
                    expect(output).to.contain('\u001b[36mhello\u001b[39m');
                    expect(output).to.contain('\u001b[36mapplication\u001b[39m');
                    expect(output).to.contain('test: \u001b[31mOffline\u001b[39m');
                    expect(output).to.contain('component: \u001b[31mOffline\u001b[39m');
                    expect(output).to.contain('repoComponent: \u001b[31mOffline\u001b[39m');
                });
            });

            it('should run without issue when an application is passed in', function () {
                return Command.init(global.parseArgs('application')).then(Command.run).then(function () {
                    expect(output).to.contain('\u001b[36mapplication\u001b[39m');
                    expect(output).to.contain('test: \u001b[31mOffline\u001b[39m');
                    expect(output).to.contain('component: \u001b[31mOffline\u001b[39m');
                    expect(output).to.contain('repoComponent: \u001b[31mOffline\u001b[39m');
                });
            });

            describe('--up', function () {
                it('should only show the up layers of the application', function () {
                    return Command.init(global.parseArgs('application --up')).then(Command.run).then(function () {
                        expect(output).to.not.contain('\u001b[36mapplication\u001b[39m');
                        expect(output).to.not.contain('test: \u001b[31mOffline\u001b[39m');
                        expect(output).to.not.contain('component: \u001b[31mOffline\u001b[39m');
                        expect(output).to.not.contain('repoComponent: \u001b[31mOffline\u001b[39m');
                    });
                });
            });
        });
    });
})();
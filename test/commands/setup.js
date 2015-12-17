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

    let brain = require('../../inc/brain');

    let fs = require('fs');
    let chai = require('chai');
    let path = require('path');
    let rimraf = require('rimraf');
    let expect = require('chai').expect;

    chai.use(require('chai-as-promised'));

    let Command = require('../../inc/commands/setup');

    let defaultOptions = global.parseArgs();

    describe('Setup', function () {
        let write, log, output = '';

        beforeEach(function () {
            output = '';
            write = process.stdout.write;
            log = console.log;

            // our stub will concatenate any output to a string
            process.stdout.write = console.log = function (s) {
                output += s;
            };

            rimraf.sync(brain.settings.directories.storage);
        });

        afterEach(function () {
            process.stdout.write = write;
            console.log = log;
        });

        describe('#init', function () {
            it('should initialize without issue', function () {
                return Command.init(defaultOptions);
            });
        });

        describe('#run', function () {
            it('should run without issue', function () {
                return Command.init(defaultOptions).then(Command.run).then(function () {
                    expect(fs.existsSync(brain.settings.directories.storage)).to.equal(true);
                    expect(fs.existsSync(path.join(brain.settings.directories.storage, 'example'))).to.equal(true);
                    expect(output).to.contain('Setting up the directories needed!');
                    expect(output).to.contain(`Creating directory ${brain.settings.directories.storage}/example`);
                });
            });

            describe('--quiet', function () {
                it('should run without printing anything with the quiet option', function () {
                    return Command.init(global.parseArgs('--quiet')).then(Command.run).then(function () {
                        expect(fs.existsSync(brain.settings.directories.storage)).to.equal(true);
                        expect(fs.existsSync(path.join(brain.settings.directories.storage, 'example'))).to.equal(true);
                        expect(output).to.equal('');
                    });
                });
            });
        });
    });
})();
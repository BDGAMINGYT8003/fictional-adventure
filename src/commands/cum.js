'use strict';
const { createMediaCommand } = require('../core/commandFactory');
const definitions = require('./mediaDefinitions');
module.exports = createMediaCommand(definitions.find(command => command.name === 'cum'));

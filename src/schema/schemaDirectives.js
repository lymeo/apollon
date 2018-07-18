const requireDir = require('require-dir');
const logger = require('../logger');

let schemaDirectives = requireDir('../../directives');
logger.debug('Included directive implementations');

module.exports = schemaDirectives;
const fs = require('fs');
const path = require('path');
const logger = require('../logger');

// Reading schema file
let typeDefs = '';
logger.trace('Created specification typeDefs schema');

typeDefs +=
	'\n' +
	fs.readFileSync(path.join(__dirname, '../../schema/directives.gql'), {
		encoding: 'utf8'
	});
logger.trace('Added directives to specification schema');

typeDefs +=
	'\n' +
	fs.readFileSync(path.join(__dirname, '../../schema/interfaces.gql'), {
		encoding: 'utf8'
	});
logger.trace('Added interfaces to specification schema');

typeDefs +=
	'\n' +
	fs.readFileSync(path.join(__dirname, '../../schema/types.gql'), {
		encoding: 'utf8'
	});
logger.trace('Added types to specification schema');

typeDefs +=
	'\n' +
	fs.readFileSync(path.join(__dirname, '../../schema/queries.gql'), {
		encoding: 'utf8'
	});
logger.trace('Added types to queries schema');

typeDefs +=
	'\n' +
	fs.readFileSync(path.join(__dirname, '../../schema/mutations.gql'), {
		encoding: 'utf8'
	});
logger.trace('Added types to mutations schema');

typeDefs +=
	'\n' +
	fs.readFileSync(path.join(__dirname, '../../schema/inputs.gql'), {
		encoding: 'utf8'
	});
logger.trace('Added inputs to mutations schema');
typeDefs +=
	'\n' +
	fs.readFileSync(path.join(__dirname, '../../schema/subscriptions.gql'), {
		encoding: 'utf8'
	});
logger.trace('Added subscriptions to mutations schema');

module.exports = typeDefs;

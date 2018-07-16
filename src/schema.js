const resolvers = require('./resolvers');
const fs = require('fs');
const path = require('path');
const requireDir = require('require-dir');
let debug = require('debug')('apollon');

// Reading schema file
let typeDefs = '';
debug('Created specification schema');

typeDefs +=
	'\n' +
	fs.readFileSync(path.join(__dirname, '../schema/directives.gql'), {
		encoding: 'utf8'
	});
debug('Added directives to specification schema');

typeDefs +=
	'\n' +
	fs.readFileSync(path.join(__dirname, '../schema/types.gql'), {
		encoding: 'utf8'
	});
debug('Added types to specification schema');

typeDefs +=
	'\n' +
	fs.readFileSync(path.join(__dirname, '../schema/queries.gql'), {
		encoding: 'utf8'
	});
debug('Added types to queries schema');

typeDefs +=
	'\n' +
	fs.readFileSync(path.join(__dirname, '../schema/mutations.gql'), {
		encoding: 'utf8'
	});
debug('Added types to mutations schema');

typeDefs +=
	'\n' +
	fs.readFileSync(path.join(__dirname, '../schema/inputs.gql'), {
		encoding: 'utf8'
	});
debug('Added inputs to mutations schema');
// typeDefs += "\n" + fs.readFileSync(path.join(__dirname, "../schema/subscriptions.gql"), {
//   encoding: "utf8"
// });

let schemaDirectives = requireDir('../directives');
debug('Included directive implementations');

// Generate the schema object from schema file and definition.
module.exports = {
	typeDefs,
	resolvers,
	schemaDirectives
};

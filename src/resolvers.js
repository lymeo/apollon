const { URL } = require('url');
let debug = require('debug')('apollon');

// const { PubSub } = require("graphql-subscriptions");
// const pubsub = new PubSub();

const requireDir = require('require-dir');
const { Kind } = require('graphql/language');
// const pubsub = require('../pubsub');

class ValidationError extends Error {
	constructor(message, field) {
		super(message);
		this.field = field;
	}
}

function assertValidLink({ url }) {
	try {
		new URL(url);
	} catch (error) {
		throw new ValidationError('Link validation error: invalid url.', 'url');
	}
}

let schema = requireDir('../types');
debug('Created the schema for the resolvers from the types file');

schema.Query = {};
schema.Mutation = {};
debug('Added the Query, Mutation to the executable schema');

requireDir('../resolvers', {
	mapValue: function(value, baseName) {
		return value(schema);
	}
});
debug('Included resolver implementations');

if (Object.keys(schema.Query).length == 0) {
	delete schema.Query;
	debug('Removed the empty query field from executable schema');
}
if (Object.keys(schema.Mutation).length == 0) {
	delete schema.Mutation;
	debug('Removed the empty mutation field from executable schema');
}

module.exports = schema;

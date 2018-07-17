const { URL } = require('url');
const logger = require('./logger');

// const { PubSub } = require("graphql-subscriptions");
// const pubsub = new PubSub();

const requireDir = require('require-dir');
const { Kind } = require('graphql/language');
// const pubsub = require('../pubsub');

let schema = requireDir('../types');
logger.debug('Created the schema for the resolvers from the types file');

schema.Query = {};
schema.Mutation = {};
logger.debug('Added the Query, Mutation to the executable schema');

requireDir('../resolvers', {
	mapValue: function(value, baseName) {
		return value(schema);
	}
});
logger.debug('Included resolver implementations');

if (Object.keys(schema.Query).length == 0) {
	delete schema.Query;
	logger.debug('Removed the empty query field from executable schema');
}
if (Object.keys(schema.Mutation).length == 0) {
	delete schema.Mutation;
	logger.debug('Removed the empty mutation field from executable schema');
}

module.exports = schema;

const logger = require('../logger');

const requireDir = require('require-dir');

let schema = requireDir('../../types');
logger.trace('Created the schema for the resolvers from the types file');

schema.Query = {};
schema.Mutation = {};
schema.Subscription = {};
logger.trace('Added the Query, Mutation and Subscription to the executable schema');

requireDir('../../resolvers', {
	mapValue: function (value, baseName) {
		logger.trace('Initiating resolvers', baseName)
		return value(schema, {
			//Helpers
			SimpleSubscription: function (sub) {
				schema.Subscription[sub] = {
					subscribe: (_, __, {
						pubsub
					}) => {
						return pubsub.asyncIterator(sub);
					}
				}
			},
			fs: require("../helpers/fs")

		});
	}
});
logger.trace('Included resolver implementations');

if (Object.keys(schema.Query).length == 0) {
	delete schema.Query;
	logger.trace('Removed the empty query field from executable schema');
}
if (Object.keys(schema.Mutation).length == 0) {
	delete schema.Mutation;
	logger.trace('Removed the empty mutation field from executable schema');
}
if (Object.keys(schema.Subscription).length == 0) {
	delete schema.Subscription;
	logger.trace('Removed the empty subscription field from executable schema');
}

module.exports = schema;
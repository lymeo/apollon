const logger = require('../logger');

const requireDir = require('require-dir');

let schema = requireDir('../../types');
logger.debug('Created the schema for the resolvers from the types file');

schema.Query = {};
schema.Mutation = {};
schema.Subscription = {};
logger.debug('Added the Query, Mutation and Subscription to the executable schema');

requireDir('../../resolvers', {
	mapValue: function (value, baseName) {
		logger.debug('Initiating resolvers', baseName)
		return value(schema, {

			SimpleSubscription: function (sub) {
				schema.Subscription[sub] = {
					subscribe: (_, __, {
						pubsub
					}) => {
						return pubsub.asyncIterator(sub);
					}
				}
			}

		});
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
if (Object.keys(schema.Subscription).length == 0) {
	delete schema.Subscription;
	logger.debug('Removed the empty subscription field from executable schema');
}

module.exports = schema;
require('@babel/polyfill');
require('@babel/register');
require('@babel/plugin-proposal-pipeline-operator');
require('babel-plugin-transform-function-bind');

const logger = require('./logger');

const express = require('express');
const { execute, subscribe } = require('graphql');
const { graphqlExpress } = require('apollo-server-express');
const expressPlayground = require('graphql-playground-middleware-express').default;
const { createServer } = require('http');
const cors = require('cors');
const bodyParser = require('body-parser');
const requireDir = require('require-dir');
const { SubscriptionServer } = require('subscriptions-transport-ws');
const { PubSub } = require('graphql-subscriptions');
const pubsub = new PubSub();

const authenticate = require('../other/authentication');
const init = require('../other/initialisation');
const formatError = require('./formatError');
const connectors = requireDir('../connectors');

const { makeExecutableSchema } = require('graphql-tools');
const rawSchema = requireDir('./schema');
const schema = makeExecutableSchema(rawSchema);

const corsConfig = require('../config/cors.json');
const config = require('../config/general.json');

const start = async () => {
	logger.info('Apollon initializing');

	// Initialisation of the connectors
	for (let connectorName in connectors) {
		connectors[connectorName] = connectors[connectorName].apply({ logger });
	}

	logger.debug('Waiting for connectors to initialize');
	// Waiting for them to be ready
	for (let connectorName in connectors) {
		connectors[connectorName] = await connectors[connectorName];
	}
	logger.debug('Connectors initialized');

	const app = express();
	logger.debug('Express app started');

	let context = {
		connectors,
		app,
		config,
		pubsub,
		logger: logger.child({ scope: 'userland' })
	};
	logger.debug('Created context object');

	let authenticateMid = authenticate(context);
	logger.debug('Authentication middleware generated');

	async function boot() {
		if (process.argv[2] == 'dev' || process.env.NODE_ENV == 'dev') {
			app.use(
				'/playground',
				cors(corsConfig),
				bodyParser.json(),
				expressPlayground({
					endpoint: config.endpoint || '/',
					SubscriptionEndpoint: `ws://localhost:3000/subscriptions`
				})
			);
			logger.info('Endpoint /playground is accessible');
		}

		app.use(
			config.endpoint || '/',
			cors(corsConfig),
			bodyParser.json(),
			function(request, response, next) {
				authenticateMid(
					request,
					() => {
						logger.info({ request }, 'Authentication passed');
						next();
					},
					() => {
						logger.warn({ request }, 'Authentication rejected');
						response.status(401).send();
					}
				);
			},
			graphqlExpress(async (request, response) => {
				return {
					context: {
						connectors,
						app,
						request,
						response,
						config,
						pubsub,
						logger: logger.child({ scope: 'userland' })
					},
					formatError,
					schema,
					playground: true
				};
			})
		);
		logger.debug('Initialised the main endpoint', { port: config.endpoint || '/' });

		const server = createServer(app);
		const PORT = process.env.PORT || 3000;
		logger.debug('Wrapping app in an HTTP server');

		server.listen(PORT, () => {
			SubscriptionServer.create(
				{
					execute,
					subscribe,
					schema,
					onOperation: (message, params, webSocket) => {
						return { ...params, context };
					}
				},
				{
					server,
					path: '/subscriptions'
				}
			);
			logger.debug('Subscription server created');
			logger.info('Apollon started', { port: PORT });
		});
	}

	init(context, boot);
};

start();

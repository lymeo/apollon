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
const { apolloUploadExpress } = require('apollo-upload-server');


const requireDir = require('require-dir');
const { SubscriptionServer } = require('subscriptions-transport-ws');
const { PubSub } = require('graphql-subscriptions');
const pubsub = new PubSub();

const authenticate = require('../other/authentication');
const init = require('../other/initialisation');
const connectors = requireDir('../connectors');

const { makeExecutableSchema } = require('graphql-tools');
const rawSchema = requireDir('./schema');
const schema = makeExecutableSchema(rawSchema);

const corsConfig = require('../config/cors.json');
const config = require('../config/general.json');

const start = async () => {
	const PORT = process.env.PORT || 3000;

	let childLogger = logger.child({ scope: 'userland' });

	childLogger.domain = function(obj, potMessage){
		const domain = {scope: "domain"};
		if(potMessage){
			childLogger.info(Object.assign(obj,domain), potMessage)
		} else {
			childLogger.info(domain, obj);
		}
	}

	const app = express();
	logger.trace('Express app started');

	const context = {
		PORT,
		ENDPOINT: config.endpoint || '/',
		connectors,
		app,
		config,
		pubsub,
		logger: childLogger
	};
	logger.trace('Created context object');

	logger.info('Apollon initializing');

	// Initialisation of the connectors
	for (let connectorName in connectors) {
		connectors[connectorName] = connectors[connectorName].apply(context);
	}

	logger.trace('Waiting for connectors to initialize');
	// Waiting for them to be ready
	for (let connectorName in connectors) {
		connectors[connectorName] = await connectors[connectorName];
	}
	logger.trace('Connectors initialized');

	let authenticateMid = authenticate(context);
	logger.trace('Authentication middleware generated');
	
	async function boot() {
		app.use(cors(corsConfig));

		if (process.argv[2] == 'dev' || process.env.NODE_ENV == 'dev') {
			app.use(
				'/playground',
				expressPlayground({
					endpoint: config.endpoint || '/',
					SubscriptionEndpoint: `ws://localhost:3000/subscriptions`
				}),
				() => {}
			);
			logger.info('Endpoint /playground is accessible');
		}

		app.use(
			config.endpoint || '/',
			bodyParser.json(),
			apolloUploadExpress(),
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
						PORT,
						ENDPOINT: config.endpoint || '/',
						connectors,
						app,
						request,
						response,
						config,
						pubsub,
						logger: childLogger
					},
					formatError: e => logger.error(e),
					schema,
					playground: true
				};
			})
		);
		logger.trace('Initialised the main endpoint', { endpoint: config.endpoint || '/' });

		logger.trace('Wrapping app in an HTTP server');

		const server = createServer(app);

		context.server = server;

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
			logger.trace('Subscription server created');
			logger.info('Apollon started', { port: PORT });
			if(process.argv[2] == 'test' || process.env.NODE_ENV == 'test' || process.env.NODE_ENV == 'tests'){
				require("./tests")(context)
			}
		});
	}

	init(context, boot);
};

module.exports = {
	start
};

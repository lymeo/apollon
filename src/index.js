require('@babel/polyfill');
require('@babel/register');
require('@babel/plugin-proposal-pipeline-operator');
require('babel-plugin-transform-function-bind');
let debug = require('debug')('apollon');

const express = require('express');
const { execute, subscribe } = require('graphql');
const { graphqlExpress, graphiqlExpress } = require('apollo-server-express');
const { createServer } = require('http');
const cors = require('cors');
const bodyParser = require('body-parser');
const requireDir = require('require-dir');
// const { SubscriptionServer } = require("subscriptions-transport-ws");
// const asyncify = require("callback-to-async-iterator");

const authenticate = require('../other/authentication');
const formatError = require('./formatError');
const connectors = requireDir('../connectors');

const { makeExecutableSchema } = require('graphql-tools');
const rawSchema = require('./schema');
const schema = makeExecutableSchema(rawSchema);

const corsConfig = require('../config/cors.json');
const config = require('../config/general.json');

const start = async () => {
	debug('Apollon initializing');

	// Initialisation of the connectors
	for (let connectorName in connectors) {
		connectors[connectorName] = connectors[connectorName]();
	}

	debug('Waiting for connectors to initialize');
	// Waiting for them to be ready
	for (let connectorName in connectors) {
		connectors[connectorName] = await connectors[connectorName];
	}

	debug('Starting the express app');
	const app = express();
	debug('Generating authentication middleware');
	let authenticateMid = authenticate({ connectors, app, config });

	if (process.argv[2] == 'dev' || process.env.NODE_ENV == 'dev') {
		debug('Starting the GraphIQL endpoint');
		app.use(
			'/graphiql',
			cors(corsConfig),
			bodyParser.json(),
			graphiqlExpress({
				endpointURL: config.endpoint || '/'
				// SubscriptionEndpoint: `ws://localhost:3000/subscriptions`
			})
		);
		console.log('Endpoint /graphiql is accessible');
	}

	debug('Starting the main endpoint on %s', config.endpoint || '/');
	app.use(
		config.endpoint || '/',
		cors(corsConfig),
		bodyParser.json(),
		function(request, response, next) {
			authenticateMid(
				request,
				() => {
					debug('Authentication passed: %s', JSON.stringify(request.body));
					next();
				},
				() => {
					debug('Authentication rejected: %s', JSON.stringify(request.body));
					response.status(401).send();
				}
			);
		},
		graphqlExpress(async (request, res) => {
			return {
				context: {
					connectors,
					app,
					request,
					config
				},
				formatError,
				schema
			};
		})
	);

	debug('Starting the main endpoint');
	const server = createServer(app);
	const PORT = process.env.PORT || 3000;

	server.listen(PORT, () => {
		debug('Apollon started on port %s', PORT);
		console.log(`Apollon server running on port ${PORT}.`);

		// SubscriptionServer.create(
		//   {
		//     execute,
		//     subscribe,
		//     schema,
		//     onConnect: async (connectionParams, webSocket) => {
		//       console.log('webSocket connected');
		//     }
		//   },
		//   {
		//     server,
		//     path: "/subscriptions"
		//   }
		// );
	});
};

start();

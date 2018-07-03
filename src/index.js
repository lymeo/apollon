require("@babel/polyfill");
require("@babel/register");
require("@babel/plugin-proposal-pipeline-operator");
require("babel-plugin-transform-function-bind");

const express = require("express");
const { execute, subscribe } = require("graphql");
const { graphqlExpress, graphiqlExpress } = require("apollo-server-express");
const { createServer } = require("http");
const cors = require("cors");
const bodyParser = require("body-parser");
const requireDir = require("require-dir");
// const { SubscriptionServer } = require("subscriptions-transport-ws");
// const asyncify = require("callback-to-async-iterator");

const schema = require("./schema");
const authenticate = require("./authentication");
const formatError = require("./formatError");
const connectors = requireDir("../connectors");

const start = async () => {
  // Initialisation of the connectors

  for (let connectorName in connectors) {
    connectors[connectorName] = connectors[connectorName]();
  }

  // Waiting for them to be ready

  for (let connectorName in connectors) {
    connectors[connectorName] = await connectors[connectorName];
  }
  const app = express();

  app.use(
    "/graphql",
    cors(),
    authenticate(connectors),
    bodyParser.json(),
    graphqlExpress(async (req, res) => {
      return {
        context: {
          connectors,
          app
        },
        formatError,
        schema
      };
    })
  );

  app.use(
    "/graphiql",
    cors(),
    bodyParser.json(),
    graphiqlExpress({
      endpointURL: "/graphql"
      // SubscriptionEndpoint: `ws://localhost:3000/subscriptions`
    })
  );

  const server = createServer(app);
  const PORT = 3000;

  server.listen(PORT, () => {
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

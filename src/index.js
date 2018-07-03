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
  for (let propertyName in connectors) {
    connectors[propertyName] = await connectors[propertyName]();
  }

  const app = express();

  app.use(
    "/graphql",
    cors(),
    // authenticate(orientDb),
    bodyParser.json(),
    graphqlExpress(async (req, res) => {
      return {
        context: {
          // orientDb: connectors.orientDb,
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
      endpointURL: "/graphql",
      // SubscriptionEndpoint: `ws://localhost:3000/subscriptions`
    })
  );

  const server = createServer(app);
  const PORT = 3000;

  server.listen(PORT, () => {
    console.log(`Lymeo GraphQL server running on port ${PORT}.`);

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

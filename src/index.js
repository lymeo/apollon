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

const authenticate = require("../other/authentication");
const formatError = require("./formatError");
const connectors = requireDir("../connectors");

const {makeExecutableSchema} = require('graphql-tools');
const rawSchema = require("./schema");
const schema = makeExecutableSchema(rawSchema);

const corsConfig = require("../config/cors.json");
const config = require("../config/general.json");


const start = async () => {
  
  // Initialisation of the connectors
  for (let connectorName in connectors) {
    connectors[connectorName] = connectors[connectorName]();
  }

  // Waiting for them to be ready
  for (let connectorName in connectors) {
    connectors[connectorName] = await connectors[connectorName];
  }

  //Generate authentication middleware
  const app = express();
  let authenticateMid = authenticate({connectors, app, config});

  if (process.argv[2] == "dev" || process.env.NODE_ENV == "dev"){
    console.log("Endpoint /graphiql is accessible");
    app.use(
      "/graphiql",
      cors(corsConfig),
      bodyParser.json(),
      graphiqlExpress({
        endpointURL: config.endpoint || "/"
        // SubscriptionEndpoint: `ws://localhost:3000/subscriptions`
      })
    );
  }
  

  app.use(config.endpoint || "/",
    cors(corsConfig),
    function(request, response, next){
      authenticateMid(request, next, function(){
        response.status(401).send();
      });
    },
    bodyParser.json(),
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


  const server = createServer(app);
  const PORT = process.env.PORT || 3000;

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

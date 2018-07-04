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
const corsConfig = require("../config/cors.json");


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
  let authenticateMid = authenticate(connectors);

  const app = express();
  console.log(process.env.NODE_ENV)
  if (process.env.NODE_ENV == "dev"){
    console.log("Endpoint /graphiql is accessible");
    app.use(
      "/graphiql",
      cors(corsConfig),
      bodyParser.json(),
      graphiqlExpress({
        endpointURL: "/"
        // SubscriptionEndpoint: `ws://localhost:3000/subscriptions`
      })
    );
  }
  

  app.use("/",
    cors(corsConfig),
    function(request, response, next){
      authenticateMid(request, next, function(){
        response.status(401).send();
      });
    },
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

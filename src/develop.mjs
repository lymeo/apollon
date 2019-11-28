import logger from "./logger";
import mergeDeep from "./helpers/deepMerge";

import glob from "glob";
import path from "path";
import express from "express";
import { execute, subscribe } from "graphql";
import cors from "cors";
import bodyParser from "body-parser";
import { apolloUploadExpress } from "apollo-upload-server";
import expressPlayground from "graphql-playground-middleware-express";
import { SubscriptionServer } from "subscriptions-transport-ws";

// CJS compatibility
import apollo_server_express from "apollo-server-express";
const { graphqlExpress } = apollo_server_express;

import http from "http";
const { createServer } = http;

import subscriptions from "graphql-subscriptions";
const { PubSub } = subscriptions;

//Initial config
import config from "./config.mjs";

const pubsub = new PubSub();

// Scope exporting functions
function setConfig(p_newConfig) {
  return mergeDeep(config, p_newConfig || {});
}

let initialisation = async function initialisation(context, start) {
  return start();
};

function setInitilisation(p_newIniliser) {
  initialisation = p_newIniliser;
}

// Bootstrapper function
const start = async p_config => {
  logger.info("Welcome to Apollon");
  logger.info("Apollon will start initializing");

  //Take into account post-start settings
  mergeDeep(config, p_config);

  // Set up the final config
  logger.debug("- Preparing config");
  const configs = glob.sync(config.sources.config).map(filepath => {
    logger.debug({ filepath }, `-- Importing config file`);
    return import(path.join(process.cwd(), filepath));
  });
  mergeDeep(config, ...(await Promise.all(configs)).map(e => e.default));

  // Changing CWD to match potential root configuration
  logger.debug(`- Defining project root => ${config.root}`);
  process.chdir(config.root.toString());

  //Setting up child logger
  logger.debug("- Setting up logging");
  let childLogger = logger.child({ scope: "userland" });
  childLogger.domain = function(obj, potMessage) {
    const domain = { scope: "domain" };
    if (potMessage) {
      childLogger.info(Object.assign(obj, domain), potMessage);
    } else {
      childLogger.info(domain, obj);
    }
  };

  // Setting up schema
  logger.info("Building executable schema");
  const schema = await (await import("./schema_develop")).default(config);

  //Setting up underlying web server
  logger.info("Setting up connectivity");
  logger.debug("- Setting up underlying web server");
<<<<<<< HEAD
  const PORT = process.env.PORT || config.port || 3000;
=======
  const PORT = config.port || process.env.PORT || 3000;
>>>>>>> c96b2d1621b4baeb271d139c7a77098ced301edc
  const app = express();

  logger.debug("- Creating context object");
  const context = {
    PORT,
    ENDPOINT: config.endpoint || "/",
    app,
    config,
    pubsub,
    logger: childLogger
  };

  // Importing connectors
  logger.debug("- Setting up Apollon connectors");
  let connectors = (await Promise.all(
    glob.sync(config.sources.connectors).map(p_filepath => {
      logger.debug({ filepath: p_filepath }, `-- Importing connector`);
      return import(path.join(process.cwd(), p_filepath));
    })
  )).map(implementation => implementation.default);
  context.connectors = connectors;

  //Initialization of connectors
  logger.debug("- Initialisation of the connectors");
  for (let connectorName in connectors) {
    connectors[connectorName] = connectors[connectorName].apply(context);
  }
  logger.debug("-- Waiting for connectors to initialize");
  for (let connectorName in connectors) {
    connectors[connectorName] = await connectors[connectorName];
  }
  logger.debug("-- Connectors initialized");

  //Middleware
  logger.debug("- Importing middlewares");
  const middlewares = (await Promise.all(
    glob.sync(config.sources.middlewares).map(p_filepath => {
      logger.debug({ filepath: p_filepath }, `-- Imported middleware`);
<<<<<<< HEAD
      return import(path.join(process.cwd(), p_filepath));
    })
  )).map(middlewareImpl => {
    return function(request, response, next) {
      middlewareImpl.default(context)(
=======
      return import(path.join(process.cwd(), p_filepath))(context);
    })
  )).map(middlewareImpl => {
    return function(request, response, next) {
      middlewareImpl.default(
>>>>>>> c96b2d1621b4baeb271d139c7a77098ced301edc
        request,
        message => {
          logger.info({ request }, message);
          next();
        },
        (code, message) => {
          logger.warn({ request }, message);
          response.status(code).send();
        }
      );
    };
  });

  async function boot() {
    logger.info("Apollon is starting");
    app.use(cors(config.cors));

    app.use(
      "/playground",
      expressPlayground({
        endpoint: config.endpoint || "/",
        SubscriptionEndpoint: `ws://localhost:3000/subscriptions`
      }),
      () => {}
    );
    logger.debug("- Endpoint /playground is accessible");

    app.use(
      config.endpoint || "/",
      bodyParser.json(),
      apolloUploadExpress(),
      ...middlewares,
      graphqlExpress(async (request, response) => {
        return {
          context: {
            PORT,
            ENDPOINT: config.endpoint || "/",
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
    logger.debug("- Initialised the main endpoint", {
      endpoint: config.endpoint || "/"
    });

    logger.debug("- Wrapping app in the underlying HTTP server");

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
          path: "/subscriptions"
        }
      );
      logger.debug("- Subscription server created");
      logger.info("- Apollon started", { port: PORT });
    });
  }

  await initialisation(context, boot);
};

export { start, setConfig, setInitilisation };

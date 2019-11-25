require("@babel/polyfill");
require("@babel/register");
require("@babel/plugin-proposal-pipeline-operator");
require("babel-plugin-transform-function-bind");

const config = require("./config");

const logger = require("./logger");
const { mergeDeep } = require("./helpers/deepMerge");

const glob = require("glob");
const path = require("path");
const express = require("express");
const { execute, subscribe } = require("graphql");
const { graphqlExpress } = require("apollo-server-express");
const { createServer } = require("http");
const cors = require("cors");
const bodyParser = require("body-parser");
const { apolloUploadExpress } = require("apollo-upload-server");
const { SubscriptionServer } = require("subscriptions-transport-ws");
const { PubSub } = require("graphql-subscriptions");
const pubsub = new PubSub();

function setConfig(p_newConfig) {
  return Object.assign(config, p_newConfig || {});
}

const start = async p_config => {
  logger.info("Welcome to Apollon");
  logger.info("Apollon will start initializing");

  //Take into account post-start settings
  mergeDeep(config, p_config);

  // Changing CWD to match potential root configuration
  logger.debug(`- Defining project root => ${config.root}`);
  process.chdir(config.root);

  // Set up the final config
  logger.debug("- Preparing config");
  const configs = glob.sync(config.sources.config).map(filepath => {
    logger.debug(
      {
        filepath: path.join(process.cwd(), filepath)
      },
      `-- Importing config file`
    );
    return require(path.join(process.cwd(), filepath));
  });
  mergeDeep(config, ...configs);

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
  const schema = require("./schema")(config);

  //Setting up underlying web server
  logger.info("Setting up connectivity");
  logger.debug("- Setting up underlying web server");
  const PORT = config.port || process.env.PORT || 3000;
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
  let connectors = glob.sync(config.sources.connectors).map(p_filepath => {
    logger.debug({ filepath: p_filepath }, `-- Importing connector`);
    return require(path.join(process.cwd(), p_filepath));
  });
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
  const middlewares = glob.sync(config.sources.middlewares).map(p_filepath => {
    logger.debug({ filepath: p_filepath }, `-- Imported middleware`);
    const implementation = require(path.join(process.cwd(), p_filepath))(
      context
    );

    return function(request, response, next) {
      implementation(
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

    if (process.argv[2] == "dev" || process.env.NODE_ENV == "dev") {
      const expressPlayground = require("graphql-playground-middleware-express")
        .default;
      app.use(
        "/playground",
        expressPlayground({
          endpoint: config.endpoint || "/",
          SubscriptionEndpoint: `ws://localhost:3000/subscriptions`
        }),
        () => {}
      );
      logger.debug("- Endpoint /playground is accessible");
    }

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
      if (
        process.argv[2] == "test" ||
        process.env.NODE_ENV == "test" ||
        process.env.NODE_ENV == "tests"
      ) {
        require("./tests")(context);
      }
    });
  }

  config.initialisation(context, boot);
};

module.exports = {
  start,

  // Configuration
  setConfig,
  config
};

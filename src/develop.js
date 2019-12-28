import logger from "./logger.js";
import mergeDeep from "./helpers/deepMerge.js";

import glob from "glob";
import path from "path";
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import expressPlayground from "graphql-playground-middleware-express";
import fse from "fs-extra";
import yaml from "js-yaml";

// CJS compatibility
import apollo_server_express from "apollo-server-express";
const { graphqlExpress } = apollo_server_express;

import subTransport from "subscriptions-transport-ws";
const { SubscriptionServer } = subTransport;

import graphql from "graphql";
const { execute, subscribe } = graphql;

import http from "http";
const { createServer } = http;

import subscriptions from "graphql-subscriptions";
const { PubSub } = subscriptions;

//Initial config
import config from "./config.js";

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

  config.apollon = config.apollon || {};
  if(await fse.exists("./.apollon.yaml")){
    Object.assign(config.apollon, yaml.safeLoad(await fse.readFile("./.apollon.yaml", "utf8")));
  }

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

  //Manage plugins
  let plugins = {};
  let plugin_middlewares = [];
  if(config.apollon.plugins){
    logger.info("Loading plugins");
    for(const plugin in config.apollon.plugins){
      logger.debug(`- Importing plugin ${config.apollon.plugins[plugin].path || path.join(process.cwd(), "./node_modules/", plugin, "./index.js")}`)
      plugins[plugin] = import(config.apollon.plugins[plugin].path || path.join(process.cwd(), "./node_modules/", plugin, "./index.js"));
    }
    for(const plugin in plugins){
      plugins[plugin] = await (await plugins[plugin]).default(config.apollon.plugins[plugin]);
      if(config.apollon.plugins[plugin].alias){
        plugins[config.apollon.plugins[plugin].alias.toString()] = plugins[plugin];
      }
      plugin_middlewares.push(...(plugins[plugin].middleware || []));
    }
  }

  //Setting up underlying web server
  logger.info("Setting up connectivity");
  logger.debug("- Setting up underlying web server");
  const PORT = process.env.PORT || config.port || 3000;
  const app = express();

  logger.debug("- Creating context object");
  const context = {
    PORT,
    ENDPOINT: config.endpoint || "/",
    app,
    config,
    pubsub,
    logger: childLogger,
    plugins
  };

  // Setting up schema
  logger.info("Building executable schema");
  const schema = await (await import("./schema_develop.js")).default.call(context, config);

  // Importing connectors
  logger.debug("- Setting up Apollon connectors");
  const connectorImports = (await Promise.all(
    glob.sync(config.sources.connectors).map(p_filepath => {
      logger.debug({ filepath: p_filepath }, `-- Importing connector`);
      return import(path.join(process.cwd(), p_filepath));
    })
  )).map(implementation => implementation.default);

  //Initialization of connectors
  logger.debug("- Initialisation of the connectors");
  const connectors = {};
  for (let connector of connectorImports) {
    if(!connector.name) throw "No name defined for connector"
    connectors[connector.name] = connector.apply(context);
  }

  //Manage connectors from plugins
  for(let pluginName in plugins) {
    if(plugins[pluginName].connectors){
      for(let connectorName in plugins[pluginName].connectors){
        connectors[(config.apollon.plugins[pluginName].connector_prefix || "") + connectorName] = plugins[pluginName].connectors[connectorName].apply(context);
      }
    }
  }
  context.connectors = connectors;

  logger.debug("-- Waiting for connectors to initialize");
  for (let connectorName in connectors) {
    connectors[connectorName] = await connectors[connectorName];
  }
  logger.debug("-- Connectors initialized");

  //Middleware
  logger.debug("- Importing middlewares");
  const middlewares = (await Promise.all((await Promise.all(
    glob.sync(config.sources.middlewares).map(p_filepath => {
      logger.debug({ filepath: p_filepath }, `-- Imported middleware`);
      return import(path.join(process.cwd(), p_filepath));
    })
  ))
    .map(e => e.default(context))))
    .concat(plugin_middlewares)
    .map(middlewareImpl => {
      return function(request, response, next) {
        return middlewareImpl(request, response, next);
      };
    });

  async function boot() {
    logger.info("Apollon is starting");
    app.use(cors(config.cors));

    app.use(
      "/playground",
      expressPlayground.default({
        endpoint: config.endpoint || "/",
        SubscriptionEndpoint: `ws://localhost:3000/subscriptions`
      }),
      () => {}
    );
    logger.debug("- Endpoint /playground is accessible");

    app.use(
      config.endpoint || "/",
      bodyParser.json(),
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
          formatError: e => {
            logger.error(e)
            return e
          },
          debug: false,
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

export default { start, setConfig, setInitilisation };

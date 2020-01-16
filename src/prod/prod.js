import logger from "../logger.js";

import path from "path";
import fse from "fs-extra";
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
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

const pubsub = new PubSub();
let project_root = "./";

// Bootstrapper function
const start = async p_config => {
  if (p_config && p_config.root) {
    project_root = p_config.root;
  }
  logger.info("Welcome to Apollon");
  logger.info("Apollon will start initializing");

  const config = await fse.readJSON(path.join(project_root, "./config.json"));

  // Changing CWD to match potential root configuration
  logger.debug(`- Defining project root => ${project_root}`);
  process.chdir(project_root.toString());

  config.apollon = config.apollon || {};
  if (await fse.exists("./.apollon.yaml")) {
    Object.assign(
      config.apollon,
      yaml.safeLoad(await fse.readFile("./.apollon.yaml", "utf8"))
    );
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
  if (config.apollon.plugins) {
    logger.info("Loading plugins");
    for (const plugin in config.apollon.plugins) {
      logger.debug(
        `- Importing plugin ${config.apollon.plugins[plugin].path ||
          path.join(process.cwd(), "./node_modules/", plugin, "./index.js")}`
      );
      plugins[plugin] = import(
        config.apollon.plugins[plugin].path ||
          path.join(process.cwd(), "./node_modules/", plugin, "./index.js")
      );
    }
    for (const plugin in plugins) {
      plugins[plugin] = await (await plugins[plugin]).default(
        config.apollon.plugins[plugin]
      );
      if (config.apollon.plugins[plugin].alias) {
        plugins[config.apollon.plugins[plugin].alias.toString()] =
          plugins[plugin];
      }
      plugin_middlewares.push(...(plugins[plugin].middleware || []));
    }
  }

  //Setting up underlying web server
  logger.info("Setting up connectivity");
  logger.debug("- Setting up underlying web server");
  const PORT = process.env.PORT || config.port || 3000;
  const app = express();

  logger.debug("- Creating preContext object");
  const preContext = {
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
  const schema = await (await import("./schema.js")).default.call(
    preContext,
    config,
    project_root
  );

  // Importing connectors
  logger.debug("- Setting up Apollon connectors");
  const connectors = {};
  let connectorImports = (
    await Promise.all(
      config.$apollon_project_implementations.connectors.map(p_filepath => {
        logger.debug({ filepath: p_filepath }, `-- Importing connector`);
        return import(path.join(process.cwd(), p_filepath));
      })
    )
  ).map(implementation => implementation.default);
  preContext.connectors = connectors;

  //Initialization of connectors
  logger.debug("- Initialisation of the connectors");
  for (let connector of connectorImports) {
    if (!connector.name) throw "No name defined for connector";
    connectors[connector.name] = connector.apply(preContext);
  }
  for (let pluginName in plugins) {
    if (plugins[pluginName].connectors) {
      for (let connectorName in plugins[pluginName].connectors) {
        connectors[
          (config.apollon.plugins[pluginName].connector_prefix || "") +
            connectorName
        ] = plugins[pluginName].connectors[connectorName].apply(preContext);
      }
    }
  }
  logger.debug("-- Waiting for connectors to initialize");
  for (let connectorName in connectors) {
    connectors[connectorName] = await connectors[connectorName];
  }
  logger.debug("-- Connectors initialized");

  //Middleware
  logger.debug("- Importing middlewares");
  const middlewares = await Promise.all(
    (
      await Promise.all(
        config.$apollon_project_implementations.middlewares.map(p_filepath => {
          logger.debug({ filepath: p_filepath }, `-- Imported middleware`);
          return import(path.join(process.cwd(), p_filepath));
        })
      )
    )
      .concat(plugin_middlewares.map(e => ({ default: e })))
      .map(e => {
        const wrapperHelpers = { priority: 0 };
        const futurMiddleware = e.default.call(wrapperHelpers, preContext);
        futurMiddleware.wrapperHelpers = wrapperHelpers;
        return futurMiddleware;
      })
      .sort((a, b) => a.wrapperHelpers.priority - b.wrapperHelpers.priority, 0)
  );

  logger.info("Apollon is starting");
  app.use(cors(config.cors));

  const injectors = [];

  logger.debug("Retrieving injectors for context injection from plugins");
  for (let pluginName in plugins) {
    if (
      plugins[pluginName].injectors &&
      config.apollon.plugins[pluginName].priviledged
    ) {
      injectors.push(...plugins[pluginName].injectors);
    }
  }

  app.use(
    config.endpoint || "/",
    bodyParser.json(),
    ...middlewares,
    graphqlExpress(async (request, response) => {
      const context = Object.assign({}, preContext);
      context.request = request;
      context.response = response;
      await Promise.all(injectors.map(injector => injector(context)));
      return {
        context,
        formatError: e => {
          logger.error(e);
          return config.production.logErrors ? format : "An error occurred";
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

  preContext.server = server;

  for (let pluginName in plugins) {
    if (
      plugins[pluginName].priviledged &&
      config.apollon.plugins[pluginName].priviledged
    ) {
      await plugins[pluginName].priviledged(preContext);
    }
  }

  server.listen(PORT, () => {
    SubscriptionServer.create(
      {
        execute,
        subscribe,
        schema,
        onOperation: (message, params, webSocket) => {
          return { ...params, context: preContext };
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
      require("./tests")(preContext);
    }
  });

  return { context: preContext, config };
};

export default start;

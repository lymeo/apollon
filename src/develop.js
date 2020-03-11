//Third party libraries
import express from "express";

//Custom
import configBuilder from "./utils/configBuilder.js";
import typedefsBuilder from "./utils/typedefsBuilder.js";
import playgroundSettings from "./utils/playgroundSettings.js";

import pluginsLoader from "./common/plugins.js";
import subscriptionsLoader from "./common/subscriptions.js";
import resolversLoader from "./common/resolvers.js";
import connectorsLoader from "./common/connectors.js";
import injectorsLoader from "./common/injectors.js";
import middlewareLoader from "./common/middleware.js";
import directivesLoader from "./common/directives.js";
import contextLoader from "./common/context.js";

import logger from "./common/logger.js";
import server from "./utils/server.js";

// Express app
const app = express();

export default async function(config) {
  let preContext = { logger, config };
  logger.info({ environment: config.ENV }, "Welcome to Apollon");

  // Manage config
  logger.info("- Compiling configuration");
  await configBuilder.call(preContext);
  logger.trace("Final config", config);

  // Manage plugins
  logger.info("- Loading plugins");
  const plugins = await pluginsLoader.call(preContext);
  logger.trace("- Plugins", plugins);

  //Populate preContext
  logger.info("- Building preContext");
  Object.assign(preContext, {
    PORT: process.env.PORT || config.port || 3000,
    ENDPOINT: process.env.ENDPOINT || config.endpoint || "/",
    app,
    logger: logger._childLogger,
    plugins
  });

  //Setting up subscriptions
  logger.info("- Getting subscriptions ready");
  const subscriptions = await subscriptionsLoader.call(preContext);
  logger.trace("- Subscriptions", subscriptions);

  // Setting up directives
  const schema = {};
  preContext.schema = schema;
  logger.info("- Retrieving directive implementations");
  schema.schemaDirectives = await directivesLoader.call(preContext);
  logger.trace(schema.schemaDirectives, "--- Directives");

  // Setting up resolvers
  logger.info("- Retrieving resolver implementations");
  schema.resolvers = await resolversLoader.call(preContext);
  logger.trace("--- Resolvers", schema.resolvers);

  // Compiling typeDefs
  logger.info("- Compiling typeDefs (schema/specification)");
  schema.typeDefs = await typedefsBuilder.call(preContext);
  logger.trace({ typeDefs: schema.typeDefs }, "--- Typedefs");

  // Preparing connectors
  logger.info("- Loading connectors");
  const connectors = await connectorsLoader.call(preContext);
  preContext.connectors = connectors;
  logger.trace(connectors, "--- Connectors");

  // Preparing middleware
  logger.info("- Gathering middleware");
  const middleware = await middlewareLoader.call(preContext);
  preContext.middleware = middleware;
  logger.trace("--- middleware", middleware);

  // Preparing injectors
  logger.info("- Preparing injectors");
  const injectors = await injectorsLoader.call(preContext);
  preContext.injectors = injectors;
  logger.trace(injectors, "--- injectors");

  // Preparing server configuration
  preContext.serverOptions = Object.assign(
    config.apollo || {
      playground: playgroundSettings,
      debug: false,
      formatError: e => {
        logger.error(e);
        return e;
      },
      context: contextLoader(preContext, injectors, subscriptions)
    },
    {
      resolvers: schema.resolvers,
      typeDefs: schema.typeDefs,
      schemaDirectives: schema.schemaDirectives,
      subscriptions
    }
  );

  // Manage priviledged
  for (let pluginName in plugins) {
    if (
      plugins[pluginName].priviledged &&
      config.apollon.plugins[pluginName].priviledged
    ) {
      await plugins[pluginName].priviledged.call(preContext);
    }
  }

  // Manage server
  logger.info({ environment: config.ENV }, "Apollon is ready to start");
  await server.call(preContext, logger, middleware);

  return preContext;
}

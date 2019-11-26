import logger from "./logger";
import mergeDeep from "./helpers/deepMerge";

import fse from "fs-extra";

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
  logger.info("Welcome to Apollon building process");
  logger.info("Apollon will start building production ready");

  await fse.ensureDir("dist/");

  //Take into account post-start settings
  mergeDeep(config, p_config);

  // Set up the final config
  logger.info("- Preparing config");
  const configs = glob.sync(config.sources.config).map(filepath => {
    logger.debug({ filepath }, `-- Importing config file`);
    return import(path.join(process.cwd(), filepath));
  });
  mergeDeep(config, ...(await Promise.all(configs)).map(e => e.default));

  logger.info("-- Writting config");
  const confToWrite = Object.assign({}, config);
  delete confToWrite.root;
  delete confToWrite.sources;
  await fse.outputFile("dist/config.json", JSON.stringify(confToWrite));
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
  logger.info("Building schema");
  let dataFromSchema;
  const schema = await (await import("./schema")).default(
    config,
    data => (dataFromSchema = data)
  );
  // {
  //   resolvers,
  //   typeDefs,
  //   schemaDirectives,
  //   resolverFiles
  // }
  logger.info("- Outputting schemas");
  await fse.outputFile("dist/schema.gql", dataFromSchema.typeDefs);
  await fse.outputFile(
    "dist/schema.mjs",
    `export default \`${dataFromSchema.typeDefs}\``
  );

  logger.info("- Outputting resolver implementations");
  await fse.ensureDir("dist/resolvers");
  for (let filepath of dataFromSchema.resolverFiles) {
    await fse.copy(
      filepath,
      path.join("dist/resolvers/", path.basename(filepath))
    );
  }

  logger.info("- Outputting directives implementations");
  await fse.ensureDir("dist/directives");
  for (let filepath of dataFromSchema.directivesFiles) {
    await fse.copy(
      filepath,
      path.join("dist/directives/", path.basename(filepath))
    );
  }

  logger.info("- Outputting type implementations");
  await fse.ensureDir("dist/types");
  for (let filepath of dataFromSchema.typeFiles) {
    await fse.copy(filepath, path.join("dist/types/", path.basename(filepath)));
  }

  logger.info("- Outputting connector implementations");
  await fse.ensureDir("dist/connectors");
  const connectorFiles = glob.sync(config.sources.connectors);
  for (let filepath of connectorFiles) {
    await fse.copy(
      filepath,
      path.join("dist/connectors/", path.basename(filepath))
    );
  }

  logger.info("- Outputting middleware implementations");
  await fse.ensureDir("dist/middlewares");
  const middlewareFiles = glob.sync(config.sources.middlewares);
  for (let filepath of middlewareFiles) {
    await fse.copy(
      filepath,
      path.join("dist/middlewares/", path.basename(filepath))
    );
  }

  logger.info("- Outputting implementation dependencies");
  await fse.outputFile(
    "dist/implementations.mjs",
    `export let types=${JSON.stringify(
      dataFromSchema.typeFiles
    )},directives=${JSON.stringify(
      dataFromSchema.directivesFiles
    )},middlewares=${JSON.stringify(
      middlewareFiles
    )},connectors=${JSON.stringify(connectorFiles)},resolvers=${JSON.stringify(
      dataFromSchema.resolverFiles
    )};`
  );

  process.exit();

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
};

export { start, setConfig, setInitilisation };

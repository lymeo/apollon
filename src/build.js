import logger from "./logger.js";
import mergeDeep from "./helpers/deepMerge.js";

import fse from "fs-extra";

import glob from "glob";
import path from "path";

// CJS compatibility
import apollo_server_express from "apollo-server-express";
const { graphqlExpress } = apollo_server_express;

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
  logger.info("Welcome to Apollon building process");
  logger.info("Apollon will start building production ready");

  // Changing CWD to match potential root configuration
  logger.debug(`- Defining project root => ${config.root}`);
  process.chdir(config.root.toString());

  // Creating dist foleder
  logger.debug(`Creating dist folder`);
  await fse.remove("../.tmp.apollon.dist");
  await fse.remove("./dist");
  await fse.move("./node_modules", "../.tmp.apollon.node_modules");
  await fse.copy("./", "../.tmp.apollon.dist");
  await fse.move("../.tmp.apollon.dist", "./dist");
  await fse.move("../.tmp.apollon.node_modules", "./node_modules");

  //Take into account post-start settings
  mergeDeep(config, p_config);

  // Set up the final config
  logger.info("- Preparing config");
  const configFiles = glob.sync(config.sources.config);
  const configs = configFiles.map(filepath => {
    logger.debug({ filepath }, `-- Importing config file`);
    return import(path.join(process.cwd(), filepath));
  });
  mergeDeep(config, ...(await Promise.all(configs)).map(e => e.default));

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
  const schema = await (await import("./schema_develop.js")).default(
    config,
    data => (dataFromSchema = data)
  );

  logger.info("- Outputting schemas");
  await fse.outputFile("dist/schema.gql", dataFromSchema.typeDefs);
  await fse.outputFile(
    "dist/schema.js",
    `export default \`${dataFromSchema.typeDefs}\``
  );

  logger.info("Preparing implementation dependencies");
  config.$apollon_project_implementations = {
    types: dataFromSchema.typeFiles,
    directives: dataFromSchema.directivesFiles,
    middlewares: glob.sync(config.sources.middlewares),
    resolvers: dataFromSchema.resolverFiles,
    connectors: glob.sync(config.sources.connectors)
  };

  logger.info("Writting config");
  const confToWrite = Object.assign({}, config);
  delete confToWrite.root;
  delete confToWrite.sources;
  await fse.outputFile("dist/config.json", JSON.stringify(confToWrite));

  logger.info("Cleaning config files");
  await Promise.all(
    configFiles.map(filepath => fse.unlink(path.join("./dist/", filepath)))
  );
  logger.info("Cleaning schema files");
  await Promise.all(
    glob
      .sync(config.sources.schema)
      .map(filepath => fse.unlink(path.join("./dist/", filepath)))
  );
};

export default { start, setConfig, setInitilisation };

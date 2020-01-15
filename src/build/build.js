import logger from "../logger.js";
import mergeDeep from "../helpers/deepMerge.js";

import typeDefMerge from "../typedefs.js";

import fse from "fs-extra";

import glob from "glob";
import path from "path";
import yaml from "js-yaml";

//Initial config
import config from "../config.js";

// Bootstrapper function
const start = async p_config => {
  logger.info("Welcome to Apollon building process");
  logger.info("Apollon will start building production ready");

  //Removing dist to avoid glob collisions
  logger.info("Before we start: removing old dist");
  await fse.remove("./dist");

  // Changing CWD to match potential root configuration
  logger.debug(`- Defining project root => ${config.root}`);
  process.chdir(config.root.toString());

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
  logger.info("Preparing implementation dependencies");
  config.$apollon_project_implementations = {
    types: glob.sync(config.sources.types),
    directives: glob.sync(config.sources.directives),
    middlewares: glob.sync(config.sources.middlewares),
    resolvers: glob.sync(config.sources.resolvers),
    connectors: glob.sync(config.sources.connectors)
  };
  const schemaFiles = glob.sync(config.sources.schema);

  // Creating dist foleder
  logger.debug(`Creating dist folder`);
  await fse.remove("../.tmp.apollon.dist");
  await fse.remove("../.tmp.apollon.node_modules");
  await fse.move("./node_modules", "../.tmp.apollon.node_modules");
  await fse.copy("./", "../.tmp.apollon.dist");
  await fse.move("../.tmp.apollon.dist", "./dist");
  await fse.move("../.tmp.apollon.node_modules", "./node_modules");

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
    schemaFiles.map(filepath => fse.unlink(path.join("./dist/", filepath)))
  );

  logger.info("- Outputting schemas");

  const typeDefs = await typeDefMerge(schemaFiles, plugins);
  await fse.outputFile("dist/schema.gql", typeDefs);
  await fse.outputFile("dist/schema.js", `export default \`${typeDefs}\``);

  return {};
};

export default start;

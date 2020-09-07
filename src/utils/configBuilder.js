//Third party libraries
import fse from "fs-extra";
import yaml from "js-yaml";
import glob from "glob";
import path from "path";
import { pathToFileURL } from "url";

//Custom
import logger from "../common/logger.js";
import deepMerge from "./deepMerge.js";
import initialConfig from "./initialConfig.js";

export default async function() {
  // Merge default values onto config
  deepMerge(this.config, initialConfig);
  logger.trace("- Initial config merged onto manual config");

  // Changing CWD to match potential root configuration
  logger.debug(`- Defining project root => ${this.config.root}`);
  process.chdir(this.config.root.toString());

  // Loading config in Apollon file (apollon.yaml)
  this.config.apollon = this.config.apollon || {};
  if (await fse.exists("./apollon.yaml")) {
    Object.assign(
      this.config.apollon,
      yaml.safeLoad(await fse.readFile("./apollon.yaml", "utf8"))
    );
  }

  // Loading other config files
  logger.debug("- Preparing config");
  const configs = glob.sync(this.config.sources.config).map(filepath => {
    logger.debug({ filepath }, `-- Importing config file`);
    return import(pathToFileURL(path.join(process.cwd(), filepath)));
  });
  deepMerge(this.config, ...(await Promise.all(configs)).map(e => e.default));

  // Resolve globs
  this.config.$apollon_project_implementations = {
    types: glob.sync(this.config.sources.types),
    config: glob.sync(this.config.sources.config),
    directives: glob.sync(this.config.sources.directives),
    middleware: glob.sync(this.config.sources.middleware),
    resolvers: glob.sync(this.config.sources.resolvers),
    helpers: glob.sync(this.config.sources.helpers),
    subscriptions: glob.sync(this.config.sources.subscriptions)[0],
    connectors: glob.sync(this.config.sources.connectors),
    injectors: glob.sync(this.config.sources.injectors),
    schema: glob.sync(this.config.sources.schema)
  };
}

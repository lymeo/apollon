//Third party libraries
import fse from "fs-extra";
import yaml from "js-yaml";
import glob from "glob";
import path from "path";

//Custom
import deepMerge from "./deepMerge.js";
import initialConfig from "./initialConfig.js";

export default async function() {
  // Merge default values onto config
  deepMerge(this.config, initialConfig);
  this.logger.trace("- Initial config merged onto manual config");

  // Changing CWD to match potential root configuration
  this.logger.debug(`- Defining project root => ${this.config.root}`);
  process.chdir(this.config.root.toString());
  const cwd = process.cwd();

  // Loading config in Apollon file (apollon.yaml)
  this.config.apollon = this.config.apollon || {};
  if (await fse.exists("./apollon.yaml")) {
    Object.assign(
      this.config.apollon,
      yaml.safeLoad(await fse.readFile("./.apollon.yaml", "utf8"))
    );
  }

  // Loading other config files
  this.logger.debug("- Preparing config");
  const configs = glob.sync(this.config.sources.config).map(filepath => {
    this.logger.debug({ filepath }, `-- Importing config file`);
    return import(path.join(process.cwd(), filepath));
  });
  deepMerge(this.config, ...(await Promise.all(configs)).map(e => e.default));

  // Resolve globs
  this.config.$apollon_project_implementations = {
    types: glob
      .sync(this.config.sources.types)
      .map(filepath => path.join(cwd, filepath)),
    directives: glob
      .sync(this.config.sources.directives)
      .map(filepath => path.join(cwd, filepath)),
    middleware: glob
      .sync(this.config.sources.middleware)
      .map(filepath => path.join(cwd, filepath)),
    resolvers: glob
      .sync(this.config.sources.resolvers)
      .map(filepath => path.join(cwd, filepath)),
    helpers: glob
      .sync(this.config.sources.helpers)
      .map(filepath => path.join(cwd, filepath)),
    subscriptions: glob
      .sync(this.config.sources.subscriptions)
      .map(filepath => path.join(cwd, filepath))[0],
    connectors: glob
      .sync(this.config.sources.connectors)
      .map(filepath => path.join(cwd, filepath)),
    injectors: glob
      .sync(this.config.sources.injectors)
      .map(filepath => path.join(cwd, filepath)),
    schema: glob
      .sync(this.config.sources.schema)
      .map(filepath => path.join(cwd, filepath))
  };
}

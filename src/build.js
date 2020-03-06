//Third party libraries
import fse from "fs-extra";
import path from "path";

//Custom
import configBuilder from "./utils/configBuilder.js";
import schemaBuilder from "./utils/schemaBuilder.js";
import typedefsBuilder from "./utils/typedefsBuilder.js";
import pluginsLoader from "./common/plugins.js";
import logger from "./common/logger.js";

// Bootstrapper function
const start = async config => {
  let preContext = { logger, config };
  logger.info({ environment: config.ENV }, "Welcome to Apollon");

  // Changing CWD to match potential root configuration
  logger.debug(`- Defining project root => ${config.root}`);
  process.chdir(config.root.toString());

  //Removing dist to avoid glob collisions
  logger.info("- Before we start: removing old dist");
  await fse.remove("./dist");

  // Manage config
  logger.info("- Compiling configuration");
  await configBuilder.call(preContext);
  logger.trace("Final config", config);

  // Manage plugins
  logger.info("- Loading plugins");
  const { plugins, plugin_middlewares } = await pluginsLoader.call(preContext);
  logger.trace("- Plugins", plugins);
  logger.trace("- Plugin middlewares", plugin_middlewares);

  // Setting up schema
  logger.info("- Retrieving schema components");
  const schema = await schemaBuilder.call(preContext);
  preContext.schema = schema;
  logger.trace("--- Resolvers", schema.resolvers);
  logger.trace(schema.schemaDirectives, "--- Directives");

  // Compiling typeDefs
  logger.info("- Compiling typeDefs (schema/specification");
  schema.typeDefs = await typedefsBuilder.call(preContext);
  logger.trace({ typeDefs: schema.typeDefs }, "--- Typedefs");

  // Creating dist foleder
  logger.debug(`- Creating dist folder`);
  await fse.remove("../.tmp.apollon.dist");
  await fse.remove("../.tmp.apollon.node_modules");
  await fse.move("./node_modules", "../.tmp.apollon.node_modules");
  await fse.copy("./", "../.tmp.apollon.dist");
  await fse.move("../.tmp.apollon.dist", "./dist");
  await fse.move("../.tmp.apollon.node_modules", "./node_modules");

  logger.info("- Writting config");
  const confToWrite = Object.assign({}, config);
  delete confToWrite.root;
  delete confToWrite.sources;
  await fse.outputFile(
    "dist/config.js",
    `export default ${JSON.stringify(confToWrite)}`
  );

  logger.info("- Cleaning config files");
  await Promise.all(
    config.$apollon_project_implementations.config.map(filepath =>
      fse.unlink(path.join("./dist/", filepath))
    )
  );
  logger.info("- Cleaning schema files");
  await Promise.all(
    config.$apollon_project_implementations.schema.map(filepath =>
      fse.unlink(path.join("./dist/", filepath))
    )
  );

  logger.info("- Outputting schemas");
  await fse.outputFile("dist/schema.gql", schema.typeDefs);
  await fse.outputFile(
    "dist/schema.js",
    `export default \`${schema.typeDefs}\``
  );

  logger.info("Apollon build finished");

  return {};
};

export default start;

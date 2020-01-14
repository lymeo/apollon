import fs from "fs";
import path from "path";
import glob from "glob";
import logger from "../logger.js";
import GraphQlTools from "graphql-tools";
const { makeExecutableSchema } = GraphQlTools;
import typeDefMerge from "../typedefs.js";

import helperBootstrap from "../helpers/index.js";

export default async function(config) {
  logger.debug(`- Compiling directive implementations`);
  const directivesFiles = glob.sync(config.sources.directives);
  let schemaDirectives = {};
  let schemaDirectiveAsyncBuffer = [];
  directivesFiles.forEach(p_filepath => {
    const filepath = path.join(process.cwd(), p_filepath);
    schemaDirectiveAsyncBuffer.push({ filepath, impl: import(filepath) });
    logger.debug(
      { filepath: p_filepath },
      `-- Included directive implementation`
    );
  });

  //wait for all async imports and map them to schemaDirectives variable
  const directiveImplementations = await Promise.all(
    schemaDirectiveAsyncBuffer.map(e => e.impl)
  );
  directiveImplementations.forEach(
    (e, i) => (schemaDirectives[e.default.name] = e.default)
  );

  // Manage plugins directives
  for (let pluginName in this.plugins) {
    if (this.plugins[pluginName].directives) {
      for (let directive of this.plugins[pluginName].directives) {
        schemaDirectives[directive.name] = directive;
      }
    }
  }

  logger.debug("- Building specification: full GraphQL schema");

  const typeDefs = await typeDefMerge(
    glob.sync(config.sources.schema),
    this.plugins
  );

  logger.debug("-- Created the schema for the resolvers from the types file");

  let schema = { Query: {}, Mutation: {}, Subscription: {} };
  logger.debug(
    "-- Added the Query, Mutation and Subscription to the executable schema"
  );

  const typeFiles = glob.sync(config.sources.types);

  for (let p_filepath of typeFiles) {
    const filepath = path.join(process.cwd(), p_filepath);
    let type = (await import(filepath)).default;
    if (type && type.name) {
      schema[type.name] = type;
    }
  }

  //Manage types defined in plugins
  for (let pluginName in this.plugins) {
    if (this.plugins[pluginName].types) {
      for (let typeName in this.plugins[pluginName].types) {
        schema[typeName] = this.plugins[pluginName].types[typeName];
      }
    }
  }

  //Setting up directives by forwarding schema so that each directive can add its own implementation
  logger.debug(`- Delegating for resolver implementations`);
  let helpers = helperBootstrap(schema, config);

  for (let pluginName in this.plugins) {
    if (this.plugins[pluginName].helpers) {
      helpers[pluginName] = await this.plugins[pluginName].helpers(
        schema,
        config
      );
    }
  }

  const resolverFiles = glob.sync(config.sources.resolvers);
  for (let p_filepath of resolverFiles) {
    const filepath = path.join(process.cwd(), p_filepath);
    await (await import(filepath)).default.call(schema, helpers);
    logger.debug({ filepath: p_filepath }, `-- Delegated to`);
  }

  //Manage resolvers in plugins

  for (let pluginName in this.plugins) {
    if (this.plugins[pluginName].resolvers) {
      Promise.all(
        this.plugins[pluginName].resolvers.map(resolver =>
          resolver.call(schema, helpers)
        )
      );
    }
  }

  logger.debug(`- Making executable`);
  if (Object.keys(schema.Query).length == 0) {
    delete schema.Query;
    logger.debug("-- Removed the empty query field from executable schema");
  }
  if (Object.keys(schema.Mutation).length == 0) {
    delete schema.Mutation;
    logger.debug("-- Removed the empty mutation field from executable schema");
  }
  if (Object.keys(schema.Subscription).length == 0) {
    delete schema.Subscription;
    logger.debug(
      "-- Removed the empty subscription field from executable schema"
    );
  }

  return makeExecutableSchema({
    resolvers: schema,
    typeDefs,
    schemaDirectives,
    resolverFiles,
    typeFiles,
    directivesFiles
  });
}

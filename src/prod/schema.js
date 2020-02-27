import path from "path";
import logger from "../logger.js";
import GraphQlTools from "graphql-tools";
const { makeExecutableSchema } = GraphQlTools;

import helperBootstrap from "../helpers/index.js";

export default async function(config, project_root) {
  logger.debug(`- Compiling directive implementations`);
  const directivesFiles = config.$apollon_project_implementations.directives;
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

  logger.debug(`-- Including specification files`);

  let { default: typeDefs } = await import(
    path.join(project_root, "./schema.js")
  );

  logger.debug("-- Created the schema for the resolvers from the types file");

  let resolvers = { Query: {}, Mutation: {}, Subscription: {} };
  logger.debug(
    "-- Added the Query, Mutation and Subscription to the executable schema"
  );

  const typeFiles = config.$apollon_project_implementations.types;

  for (let filepath of typeFiles) {
    let type = (await import(filepath)).default;
    if (type && type.name) {
      resolvers[type.name] = type;
    }
  }

  //Manage types defined in plugins
  for (let pluginName in this.plugins) {
    if (this.plugins[pluginName].types) {
      for (let typeName in this.plugins[pluginName].types) {
        resolvers[typeName] = this.plugins[pluginName].types[typeName];
      }
    }
  }

  //Setting up directives by forwarding schema so that each directive can add its own implementation
  logger.debug(`- Delegating for resolver implementations`);
  let helpers = helperBootstrap(resolvers, config, this);
  helpers.logger = logger;

  for (let pluginName in this.plugins) {
    if (this.plugins[pluginName].helpers) {
      helpers[pluginName] = await this.plugins[pluginName].helpers(
        resolvers,
        config,
        this
      );
    }
  }

  const resolverFiles = config.$apollon_project_implementations.resolvers;
  for (let p_filepath of resolverFiles) {
    const filepath = path.join(process.cwd(), p_filepath);
    await (await import(filepath)).default.call(resolvers, this, helpers);
    logger.debug({ filepath: p_filepath }, `-- Delegated to`);
  }

  //Manage resolvers in plugins

  for (let pluginName in this.plugins) {
    if (this.plugins[pluginName].resolvers) {
      Promise.all(
        this.plugins[pluginName].resolvers.map(resolver =>
          resolver.call(resolvers, this, helpers)
        )
      );
    }
  }

  //Implement _service query to avoid users having to create dummy query
  resolvers.Query._service = _ => config.service || "GraphQL API";

  if (Object.keys(resolvers.Mutation).length == 0) {
    delete resolvers.Mutation;
    logger.debug("-- Removed the empty mutation field from executable schema");
  }
  if (Object.keys(resolvers.Subscription).length == 0) {
    delete resolvers.Subscription;
    logger.debug(
      "-- Removed the empty subscription field from executable schema"
    );
  }

  return {
    resolvers,
    typeDefs,
    schemaDirectives
  };
}

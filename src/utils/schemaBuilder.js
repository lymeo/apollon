import path from "path";
import helperBootstrap from "../common/helpers.js";
import logger from "../common/logger.js";

export default async function() {
  /*
    ### Directives
  */
  logger.debug(`- Compiling directive implementations`);
  let schemaDirectives = {};
  let schemaDirectiveAsyncBuffer = this.config.$apollon_project_implementations.directives.map(
    filepath => {
      const impl = import(path.join(process.cwd(), filepath));
      impl.filepath = filepath;
      logger.trace({ filepath }, `-- Included directive implementation`);
      return impl;
    }
  );

  //wait for all async imports and map them to schemaDirectives variable
  const directiveImplementations = await Promise.all(
    schemaDirectiveAsyncBuffer
  );
  directiveImplementations.forEach((e, i) => {
    if (e.default && e.default.name) {
      schemaDirectives[e.default.name] = e.default;
    } else {
      logger.error(
        `Directive (${schemaDirectiveAsyncBuffer[i].filepath}) could not be used. Please refer to documentation.`
      );
      process.exit(1);
    }
  });

  // Manage plugins directives
  for (let pluginName in this.plugins) {
    if (this.plugins[pluginName].directives) {
      for (let directive of this.plugins[pluginName].directives) {
        schemaDirectives[directive.name] = directive;
      }
    }
  }

  /*
    ### Resolvers
  */
  logger.debug("-- Created the schema for the resolvers from the types file");

  let resolvers = { Query: {}, Mutation: {}, Subscription: {} };
  logger.debug(
    "-- Added the Query, Mutation and Subscription to the executable schema"
  );

  for (let filepath of this.config.$apollon_project_implementations.types) {
    const type = (await import(path.join(process.cwd(), filepath))).default;
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

  logger.debug(`- Helpers`);
  let helpers = await helperBootstrap.call(this, resolvers);

  for (let pluginName in this.plugins) {
    if (this.plugins[pluginName].helpers) {
      helpers[pluginName] = await this.plugins[pluginName].helpers.call(
        this,
        resolvers
      );
    }
  }

  //Setting up resolvers by forwarding schema so that each resolver can add its own implementation
  logger.debug(`- Resolvers`);
  for (let filepath of this.config.$apollon_project_implementations.resolvers) {
    let imp = (await import(path.join(process.cwd(), filepath))).default;
    if (imp) {
      await imp.call(resolvers, this, helpers);
      logger.debug({ filepath }, `-- Delegated to`);
    } else {
      logger.warn(
        { filepath },
        `-- Supposed resolver file does not export a default async function`
      );
    }
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
  resolvers.Query._service = _ => this.config.service || "GraphQL API";

  if (Object.keys(resolvers.Mutation).length == 0) {
    delete resolvers.Mutation;
    logger.debug("-- Removed the empty mutation field from resolvers");
  }
  if (Object.keys(resolvers.Subscription).length == 0) {
    delete resolvers.Subscription;
    logger.debug("-- Removed the empty subscription field from resolvers");
  }

  return {
    resolvers,
    schemaDirectives
  };
}

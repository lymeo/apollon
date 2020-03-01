import path from "path";

import typedefsBuilder from "./typedefsBuilder.js";
import helperBootstrap from "../common/helpers.js";

export default async function() {
  /*
    ### Directives
  */
  this.logger.debug(`- Compiling directive implementations`);
  let schemaDirectives = {};
  let schemaDirectiveAsyncBuffer = [];
  this.config.$apollon_project_implementations.directives.forEach(filepath => {
    schemaDirectiveAsyncBuffer.push({ filepath, impl: import(filepath) });
    this.logger.trace({ filepath }, `-- Included directive implementation`);
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

  /*
    ### Typedefs
  */
  this.logger.debug("- Building typedefs: full GraphQL schema");
  const typeDefs = await typedefsBuilder.call(this);

  /*
    ### Resolvers
  */
  this.logger.debug(
    "-- Created the schema for the resolvers from the types file"
  );

  let resolvers = { Query: {}, Mutation: {}, Subscription: {} };
  this.logger.debug(
    "-- Added the Query, Mutation and Subscription to the executable schema"
  );

  for (let filepath of this.config.$apollon_project_implementations.types) {
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

  this.logger.debug(`- Helpers`);
  let helpers = await helperBootstrap.call(this, resolvers);

  for (let pluginName in this.plugins) {
    if (this.plugins[pluginName].helpers) {
      helpers[pluginName] = await this.plugins[pluginName].helpers.call(
        this,
        resolvers
      );
    }
  }

  //Setting up directives by forwarding schema so that each directive can add its own implementation
  this.logger.debug(`- Resolvers`);
  for (let filepath of this.config.$apollon_project_implementations.resolvers) {
    await (await import(filepath)).default.call(resolvers, this, helpers);
    this.logger.debug({ filepath }, `-- Delegated to`);
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
    this.logger.debug("-- Removed the empty mutation field from resolvers");
  }
  if (Object.keys(resolvers.Subscription).length == 0) {
    delete resolvers.Subscription;
    this.logger.debug("-- Removed the empty subscription field from resolvers");
  }

  return {
    resolvers,
    typeDefs,
    schemaDirectives
  };
}

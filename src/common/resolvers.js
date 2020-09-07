import path from "path";
import helperBootstrap from "../common/helpers.js";
import logger from "../common/logger.js";
import { pathToFileURL } from "url";

export default async function() {
  /*
    ### Resolvers
  */
  logger.debug("-- Created the schema for the resolvers from the types file");

  let resolvers = { Query: {}, Mutation: {}, Subscription: {} };
  logger.debug(
    "-- Added the Query, Mutation and Subscription to the executable schema"
  );

  for (let filepath of this.config.$apollon_project_implementations.types) {
    const type = (await import(
      pathToFileURL(path.join(process.cwd(), filepath))
    )).default;
    if (type && type.name) {
      resolvers[type.name] = type;
    }
  }

  logger.debug(`- Helpers`);
  let helpers = await helperBootstrap.call(this, resolvers);

  //Setting up resolvers by forwarding schema so that each resolver can add its own implementation
  logger.debug(`- Resolvers`);
  for (let filepath of this.config.$apollon_project_implementations.resolvers) {
    let imp = (await import(pathToFileURL(path.join(process.cwd(), filepath))))
      .default;
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

  return resolvers;
}

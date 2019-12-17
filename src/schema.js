import path from "path";
import logger from "./logger.js";
import GraphQlTools from "graphql-tools";
const { makeExecutableSchema } = GraphQlTools;

import helperBootstrap from "./helpers/index.js";

export default async function(config, project_root) {
  logger.debug(`- Compiling directive implementations`);
  const directivesFiles = config.$apollon_project_implementations.directives;
  let schemaDirectives = {};
  let schemaDirectiveAsyncBuffer = [];
  directivesFiles.forEach(p_filepath => {
    let filename = p_filepath
      .split("/")
      .slice(-1)[0]
      .split(".")[0];
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
    (e, i) => (schemaDirectives[schemaDirectiveAsyncBuffer[i]] = e.default)
  );

  logger.debug("- Building specification: full GraphQL schema");

  let queryContents = [];
  let mutationContents = [];
  let subscriptionContents = [];
  let otherContents = [];

  logger.debug(`-- Including specification files`);

  let { default: typeDefs } = await import(path.join(project_root, "./schema.js"));

  logger.debug("-- Created the schema for the resolvers from the types file");

  let schema = { Query: {}, Mutation: {}, Subscription: {} };
  logger.debug(
    "-- Added the Query, Mutation and Subscription to the executable schema"
  );

  const typeFiles = config.$apollon_project_implementations.types;

  for (let filepath of typeFiles) {
    let type = (await import(filepath)).default;
    if (type && type.name) {
      schema[type.name] = type;
    }
  }

  //Setting up directives by forwarding schema so that each directive can add its own implementation
  logger.debug(`- Delegating for resolver implementations`);
  const helpers = helperBootstrap(schema, config);
  const resolverFiles = config.$apollon_project_implementations.resolvers;
  for (let p_filepath of resolverFiles) {
    const filepath = path.join(process.cwd(), p_filepath);
    (await import(filepath)).default(schema, helpers);
    logger.debug({ filepath: p_filepath }, `-- Delegated to`);
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

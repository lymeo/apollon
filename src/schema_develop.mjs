import fs from "fs";
import path from "path";
import glob from "glob";
import logger from "./logger";
import { makeExecutableSchema } from "graphql-tools";

import helperBootstrap from "./helpers/index";

export default async function(config, hook) {
  logger.debug(`- Compiling directive implementations`);
  const directivesFiles = glob.sync(config.sources.directives);
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
  glob.sync(config.sources.schema).forEach(filepath => {
    logger.debug({ filepath }, `--- Included specification`);
    let fileContent = fs.readFileSync(filepath, { encoding: "utf8" });
    let formatedFilepath = filepath.toLowerCase();
    if (
      formatedFilepath.includes("query") ||
      formatedFilepath.includes("queries")
    ) {
      queryContents.push(fileContent);
    } else if (
      formatedFilepath.includes("mutation") ||
      formatedFilepath.includes("mutations")
    ) {
      mutationContents.push(fileContent);
    } else if (
      formatedFilepath.includes("subscription") ||
      formatedFilepath.includes("subscriptions")
    ) {
      subscriptionContents.push(fileContent);
    } else {
      let currentType = "_";
      fileContent
        .split("\n")
        .map(e => e.trim())
        .filter(e => e.length && !e.startsWith("#"))
        .forEach(p_line => {
          let line = p_line.toLowerCase();
          if (
            line.includes("{") &&
            ["query", "mutation", "subscription"].some(e => line.includes(e))
          ) {
            if (line.includes("query")) {
              currentType = "query";
            } else if (line.includes("mutation")) {
              currentType = "mutation";
            } else if (line.includes("subscription")) {
              currentType = "subscription";
            }
          } else if (currentType != "_" && line.startsWith("}")) {
            currentType = "_";
          } else {
            if (currentType == "query") {
              queryContents.push(p_line);
            } else if (currentType == "mutation") {
              mutationContents.push(p_line);
            } else if (currentType == "subscription") {
              subscriptionContents.push(p_line);
            } else {
              otherContents.push(p_line);
            }
          }
        });
    }
  });

  let typeDefs = [];

  if (queryContents.length > 0)
    typeDefs.push("type Query {\n" + queryContents.join("\n") + "\n}");
  if (mutationContents.length > 0)
    typeDefs.push("type Mutation {\n" + mutationContents.join("\n") + "\n}");
  if (subscriptionContents.length > 0)
    typeDefs.push(
      "type Subscription {\n" + subscriptionContents.join("\n") + "\n}"
    );
  if (otherContents.length > 0) typeDefs.push("\n" + otherContents.join("\n"));
  typeDefs = typeDefs.join("\n");

  logger.debug("-- Created the schema for the resolvers from the types file");

  let schema = { Query: {}, Mutation: {}, Subscription: {} };
  logger.debug(
    "-- Added the Query, Mutation and Subscription to the executable schema"
  );

  const typeFiles = glob.sync(config.sources.types);

  for (let filepath of typeFiles) {
    let type = (await import(filepath)).default;
    if (type && type.name) {
      schema[type.name] = type;
    }
  }

  //Setting up directives by forwarding schema so that each directive can add its own implementation
  logger.debug(`- Delegating for resolver implementations`);
  const helpers = helperBootstrap(schema, config);
  const resolverFiles = glob.sync(config.sources.resolvers);
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

  return (hook || makeExecutableSchema)({
    resolvers: schema,
    typeDefs,
    schemaDirectives,
    resolverFiles,
    typeFiles,
    directivesFiles
  });
}

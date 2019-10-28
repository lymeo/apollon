const fs = require("fs");
const glob = require("glob");
const logger = require("./logger");

module.exports = function(config) {
  let schemaDirectives = {};
  glob
    .sync(config.source.directives)
    .forEach(filepath => {
      let filename = filepath.split("/").slice(-1)[0].split('.')[0];
      schemaDirectives[filename] = require(filepath);
    });
  logger.trace("Included directive implementations");

  logger.trace("Created specification typeDefs schema");

  let typeDefs = glob
    .sync(config.source.schema)
    .map(filepath => fs.readFileSync(filepath, { encoding: "utf8" }))
    .join("\n");


  logger.trace("Created the schema for the resolvers from the types file");

  let schema = { Query: {}, Mutation: {}, Subscription: {} };
  logger.trace(
    "Added the Query, Mutation and Subscription to the executable schema"
  );

  glob.sync(config.source.types).forEach(filepath => {
    let type = require(filepath);
    if (type && type.name) {
      schema[type.name] = type;
    }
  });

  glob.sync(config.source.resolvers).forEach(filepath => {
    require(filepath)(schema, {
      //Helpers
      SimpleSubscription: function(sub) {
        schema.Subscription[sub] = {
          subscribe: (_, __, { pubsub }) => {
            return pubsub.asyncIterator(sub);
          }
        };
      },
      fs: require("./helpers/fs")
    });
  });

  if (Object.keys(schema.Query).length == 0) {
    delete schema.Query;
    logger.trace("Removed the empty query field from executable schema");
  }
  if (Object.keys(schema.Mutation).length == 0) {
    delete schema.Mutation;
    logger.trace("Removed the empty mutation field from executable schema");
  }
  if (Object.keys(schema.Subscription).length == 0) {
    delete schema.Subscription;
    logger.trace("Removed the empty subscription field from executable schema");
  }

  console.log("schema", schema)

  return {
    resolvers: schema,
    typeDefs,
    schemaDirectives
  };
};

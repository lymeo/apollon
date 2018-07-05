const { URL } = require("url");

// const { PubSub } = require("graphql-subscriptions");
// const pubsub = new PubSub();

const requireDir = require("require-dir");
const { Kind } = require("graphql/language");
// const pubsub = require('../pubsub');

class ValidationError extends Error {
  constructor(message, field) {
    super(message);
    this.field = field;
  }
}

function assertValidLink({ url }) {
  try {
    new URL(url);
  } catch (error) {
    throw new ValidationError("Link validation error: invalid url.", "url");
  }
}

let schema = requireDir("../types");

schema.Query = {};
schema.Mutation = {};

requireDir("../resolvers", {
  mapValue: function(value, baseName) {
    return value(schema);
  }
});

if (Object.keys(schema.Query).length == 0){
  delete schema.Query
}
if (Object.keys(schema.Mutation).length == 0){
  delete schema.Mutation
}

module.exports = schema;

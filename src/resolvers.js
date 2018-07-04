const { URL } = require("url");

// const { PubSub } = require("graphql-subscriptions");
// const pubsub = new PubSub();

const requireDir = require("require-dir");
const { GraphQLScalarType } = require("graphql");
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

const ObjectScalarType = new GraphQLScalarType({
  name: "Object",
  description: "Arbitrary object",
  parseValue: value => {
    return typeof value === "object"
      ? value
      : typeof value === "string"
        ? JSON.parse(value)
        : null;
  },
  serialize: value => {
    return typeof value === "object"
      ? value
      : typeof value === "string"
        ? JSON.parse(value)
        : null;
  },
  parseLiteral: ast => {
    switch (ast.kind) {
      case Kind.STRING:
        return JSON.parse(ast.value);
      case Kind.OBJECT:
        let robj = {};
        let r = function(root, obj) {
          if (root.fields) {
            root.fields.forEach(e => {
              if (e.value.kind == Kind.OBJECT) {
                obj[e.name.value] = {};
                return r(e.value, obj[e.name.value]);
              }
              return (obj[e.name.value] = e.value.value);
            });
          }
        };
        r(ast, robj);
        return robj;
      default:
        return null;
    }
  }
});

let schema = {
  Query: {},

  Mutation: {},

  // Subscription: {},

  Object: ObjectScalarType
};

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

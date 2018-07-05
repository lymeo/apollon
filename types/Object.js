
const { GraphQLScalarType } = require("graphql");


module.exports = new GraphQLScalarType({


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
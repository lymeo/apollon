let { SchemaDirectiveVisitor } = require("graphql-tools");
let { GraphQLInputObjectType, GraphQLString } = require("graphql");

class AuthDirective extends SchemaDirectiveVisitor {
  visitFieldDefinition(field, details) {
    let _this = this;
    if (field.resolve) {
      let oldResolver = field.resolve;
      field.resolve = async function(...args) {
        let { user } = args[2].request;
        if (
          user &&
          user.roles
            .map(e => e.name)
            .filter(e => _this.args.roles.indexOf(e) > -1).length
        ) {
          return await oldResolver(...args);
        } else {
          throw "Not authorized";
        }
      };
    }
  }
}


module.exports = AuthDirective;

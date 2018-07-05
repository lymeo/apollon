/**
 * 
 * the name of the file is the name of the directive
 * 
 */

let {
  SchemaDirectiveVisitor
} = require("graphql-tools");
let {
  defaultFieldResolver
} = require("graphql");

class AuthDirective extends SchemaDirectiveVisitor {

  visitObject(type) {
    this.ensureFieldsWrapped(type);
    type._requiredAuthRoles = this.args.roles;
  }
  // Visitor methods for nested types like fields and arguments
  // also receive a details object that provides information about
  // the parent and grandparent types.
  visitFieldDefinition(field, details) {
    this.ensureFieldsWrapped(details.objectType);
    field._requiredAuthRoles = this.args.roles;
  }

  ensureFieldsWrapped(objectType) {
    // Mark the GraphQLObjectType object to avoid re-wrapping:
    if (objectType._authFieldsWrapped) return;
    objectType._authFieldsWrapped = true;

    const fields = objectType.getFields();

    Object.keys(fields).forEach(fieldName => {
      const field = fields[fieldName];
      const {
        resolve = defaultFieldResolver
      } = field;
      field.resolve = async function (...args) {
        // Get the required Role from the field first, falling back
        // to the objectType if no Role is required by the field:
        const requiredRoles =
          field._requiredAuthRoles ||
          objectType._requiredAuthRoles;

        if (!requiredRoles) {
          return resolve.apply(this, args);
        }

        if(!args[2].request) throw "Not authorized";

        let {
          user
        } = args[2].request;
        if (
          user &&
          user.roles
          .map(e => e.name)
          .filter(e => requiredRoles.indexOf(e) > -1).length == 0
        ) {
          throw "Not authorized";
        }

        return resolve.apply(this, args);
      };
    });
  }
}


module.exports = AuthDirective;
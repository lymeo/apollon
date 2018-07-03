let { SchemaDirectiveVisitor } = require("graphql-tools");
let { GraphQLInputObjectType, GraphQLString } = require("graphql");

class FromDirective extends SchemaDirectiveVisitor {

  visitInputObject(object) {
      let types = this.schema.getTypeMap();
      let fields = object.getFields();
      let fieldsToAdd = types[this.args.name].getFields();

      for(let fieldName in fieldsToAdd){
        if(!fields[fieldName]){
          fields[fieldName] = fieldsToAdd[fieldName];
        }
      }
  }

}

module.exports = FromDirective;
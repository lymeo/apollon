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

class TriggerDirective extends SchemaDirectiveVisitor {

    visitFieldDefinition(field, {objectType}) {
        
        let subName = this.args.name

        const { resolve = defaultFieldResolver } = field;

        field.resolve = async function(root, params, context) {

            let resolverResult = await this::resolve(root, params, context); 

            if (subName && subName != '') {
                const {pubsub} = context
                
                pubsub.publish(subName, {
                    [subName]: resolverResult
                });
            }

            return resolverResult;
        };

    }

}


module.exports = TriggerDirective;
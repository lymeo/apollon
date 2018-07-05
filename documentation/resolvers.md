# Resolvers

## The folder
Resolvers are implemented in files contained in the ```/resolvers``` folder.
The namming of the files does not have any affect.

## A resolver file

The small resolver file:
```
module.exports = function(schema){

}
```
As you can see above each resolver file exports a function being passed the schema variable.

The schema variale contains the Mutation object/key, the Query object/key and other types and resolvers defined in other files.

To create a resolver for the ```getAll: [Comment]!``` query simply add a function or asynchronous function to the query object like this:
```
function bootstrapper(schema){
    schema.Query.getAll = function ........
    .........
    ..........
    ..........
    ............
}

module.exports = bootstrapper;
```
There you go, you have defined an empty resolver, now let's look closer at a single resolver defined in these files.

## Resolver function

Each resolver is sent:
  1. the object it concerns if it exists
  2. the parameters sent in the request
  3. the context object

Example:
```
const commentsDao = require("../dao/comments");

module.exports = function(schema) {
  let { Query, Mutation } = schema;

  // Type

  schema.Comment = {
    field: async (root, parameters, context) => {
        // context.request
        // context.connectors

        //root.author
        //root.content
    };
  };

  // Queries

  Query.getAll = async (root, parameters, context) => {
    // context.request
    // context.connectors
  };
  Query.getById = async (root, parameters, context) => {
    // context.request
    // context.connectors

    //parameters.id
  };

  // Mutations

  Mutation.create = async (root, parameters, context) => {
    // context.request
    // context.connectors

    //parameters.comment
  };
};

```

For how each resolver behaves please look at the document of apollo-server.
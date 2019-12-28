# Apollon: an Apollo/Express based GraphQl server

1. Getting started (step by step)
2. Getting started from template
3. The logs
4. Files
5. Plugins
6. Building and prod

## Getting started (step by step)

Add Apollon to a new project

```bash
npm init
npm install @lymeodev/apollon@2.0.0-5
```

> At this time Apollon is still in prerelease before installing please check latest version available here https://www.npmjs.com/package/@lymeodev/apollon. The package is often updated.

Apollon 2.0 uses native ESM and so to begin you need to import Apollon in your main file. You then need to tell Apollon where your project root is so it can automatically detect your files. The last step is to start Apollon. It is that easy!

Here is an example:

```javascript
// index.js
import { start, setConfig, setRootFromUrl, config } from "@lymeodev/apollon";

start.fromUrl(import.meta.url);
```

or

```javascript
// index.js
import { start, setConfig, setRootFromUrl, config } from "@lymeodev/apollon";

setRootFromUrl(import.meta.url);

start();
```

All that is left is to create your two files. The first is the specification file for example `schema.gql` as shown below:

```gql
// schema.gql
type Query {
    hello: String!
}
```

The second is the implementation named for example `resolvers.js`:

```javascript
// resolvers.js
export default async function({ Query }) {
  Query.hello = _ => "Hello world";
}
```

That's all folks you have a fully functionnal GraphQl API that can be tested at http://localhost:3000/playground

## Getting started from template

```shell
git clone https://github.com/lymeo/apollon-template.git
cd apollon-template
npm i
node index.js
```

## The logs

Apollon uses Bunyan as the native logging mecanism. To view logs in a "pretty" manner you can install bunyan with npm

```
npm install -g bunyan
```

Once installed you can pipe the logs into Bunyan like this

```
node index.js | bunyan
```

You can also change log level using env for example:

```
env LOG_LEVEL="DEBUG" node index.js | bunyan
```

## Files

### Introduction

Apollon simplifies GraphQl API development mainly by loading and managing files for you. Different files are needed to make your API function and are used at different moments. All are not necessary but there are two basic file types: specification files and the implementation files.

> The clean seperation between specification and implementation is one of GraphQl great strengths

These files are loaded based on glob rules defined in the config (`config.sources`) and defaults to the values specified in each section below.

### Specification/schema files

```javascript
// Default rules
config.sources.schema = "{"
                     //Match rules
                     + "schema/**/*.gql,"
                     + "*.gql,"

                     //Exclude rules
                     + "!(node_modules/**/**)" + "}",

```

The specification files in apollon contains fragments of the standard GraphQL schema. These fragments are written in native GraphQl.

### Implementation/resolvers files

```javascript
// Default rules
config.sources.resolvers =
  "{" +
  //Match rules
  "resolvers/**/*.js," +
  "*.resolver.js," +
  "resolver.js," +
  "*.resolvers.js," +
  "resolvers.js," +
  //Exclude rules
  "!(node_modules/**/**)" +
  "}";
```

The implementation files are written using Apollo (https://www.apollographql.com/docs/apollo-server/) logic **but are wrapped for Apollon** in an async function as depicted bellow:

```javascript
// resolvers.js
export async function(helpers){
    let n = 0

    this.Mutation.test = (root, params, context, info) => {n+=1; return n};

    this.Query.hello = (root, params, context, info) => "World";

}
```

### Connector files

```javascript
// Default rules
config.sources.connectors = "{"
                     //Match rules
                     + "connectors/**/*.js,"
                     + "*.connector.js,"
                     + "*.connectors.js,"

                     //Exclude rules
                     + "!(node_modules/**/**)" + "}",

```

Connector files even though optional are really usefull building blocks for your GraphQl APIs. Connector files define a connector that can be used in Apollon files to access databases, file systems or any data source. Connectors can be seen like drivers.

> Connectors enables you to seperate request and data processing from data storage or access.

Connector implementation is based on the return value of an async function as shown below:

```javascript
export default async function MongoDB() {
  return {
    read: function() {
      return "stuff";
    }
  };
}
```

The async function name is used as the connector name and will default to `default` if none is provided. The connector once loaded is accessible in the context as follows:

```javascript
// resolvers.js
export async function(helpers){

    this.Query.hello = (root, params, context, info) => {
        return context.connectors.MongoDB.read();
    }
    this.Query.hello2 = (root, params, {connectors: {MongoDB}}, info) => {
        return MongoDB.read();
    }

}
```

You are free to implement the connector as you seem fit.

### Config files

```javascript
// Default rules
config.sources.types = "{"
                     //Match rules
                     + "config/**/*.js,"
                     + "*.config.js,"

                     //Exclude rules
                     + "!(node_modules/**/**)" + "}",

```

Config files are implemented in simple js files exporting an object as displayed below:

```javascript
export default {
  port: 3000,
  plugins: [],
  root: "./",

  //Glob patterns used as sources for the different files
  sources: {
    resolvers:
      "{resolvers/**/*.js,*.resolver.js,resolver.js,*.resolvers.js,resolvers.js,resolvers/**/*.mjs,*.resolver.mjs,resolver.mjs,*.resolvers.mjs,resolvers.mjs,!(node_modules/**/**)}",
    connectors:
      "{connectors/**/*.js,*.connector.js,,*.connectors.js,connectors/**/*.mjs,*.connector.mjs,,*.connectors.mjs,!(node_modules/**/**)}",
    directives:
      "{directives/**/*.js,*.directive.js*.directives.js,directives/**/*.mjs,*.directive.mjs*.directives.mjs,!(node_modules/**/**)}",
    types:
      "{types/**/*.js,*.type.js,*.types.js,types/**/*.mjs,*.type.mjs,*.types.mjs,!(node_modules/**/**)}",
    schema: "{*.gql,schema/**/*.gql,!(node_modules)/*.gql}",
    config:
      "{config.js,config.mjs,*.config.js,*.config.mjs,config/**/*.js,config/**/*.mjs,!(node_modules/**/**)}",
    middlewares:
      "{middleware/**/*.js,middleware/**/*.mjs,*.mw.mjs,,*.mw.js,!(node_modules/**/**)}"
  },

  //Default CORS settings
  cors: {
    origin: "*",
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    preflightContinue: false,
    optionsSuccessStatus: 204
  }
};
```

The configuration can be seperated into multiple files and will be deep merged together. The configuration is injected in the context and is accessible under the key config: `context.config`

### Middleware files

```javascript
// Default rules
config.sources.types = "{"
                     //Match rules
                     + "middleware/**/*.js,"
                     + "*.mw.js,"
                     + "*.middleware.js,"

                     //Exclude rules
                     + "!(node_modules/**/**)" + "}",

```

Middleware files are used in the express app to catch and manage global http or GraphQL behavior. Authentication, file uploading and dynamic request modifications can be done using middleware. Middleware is implemented as follows:

```javascript
// authentication.mw.js
export default async function middlewareWrapper(context) {
  return async function authenticate(request, response, next) {
    context.logger.debug("Hello world from middleware");
    return next();
  };
}
```

The middleware is wrapped in an async function enabling dynamic generation of the express middleware and contextualised behavior through the context passed to the async function.

### Type implementation files

```javascript
// Default rules
config.sources.types = "{"
                     //Match rules
                     + "types/**/*.js,"
                     + "*.type.js,"
                     + "*.types.js,"

                     //Exclude rules
                     + "!(node_modules/**/**)" + "}",

```

Type files are used to implement types and follow Apollo logic. Types can be implemented as follows:

```javascript
// object.type.js
import GraphQl from "graphql";

export default new GraphQl.GraphQLScalarType({
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
```

### Directive implementation files

```javascript
// Default rules
config.sources.types = "{"
                     //Match rules
                     + "directives/**/*.js,"
                     + "*.directive.js,"
                     + "*.directives.js,"

                     //Exclude rules
                     + "!(node_modules/**/**)" + "}",
```

Directive files enable to implement new directives and are implemented as follows:

```javascript
// trigger.directive.js
import GraphQlTools from "graphql-tools";

class TriggerDirective extends GraphQlTools.SchemaDirectiveVisitor {
  visitFieldDefinition(field, { objectType }) {
    let subName = this.args.name;

    const { resolve = defaultFieldResolver } = field;

    field.resolve = async function(root, params, context) {
      let resolverResult = await resolve.call(this, root, params, context);

      if (subName && subName != "") {
        const { pubsub } = context;

        pubsub.publish(subName, {
          [subName]: resolverResult
        });
      }

      return resolverResult;
    };
  }
}

export default TriggerDirective;
```

## Plugins

> Content comming soon

## Building

> Content comming soon

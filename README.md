# Apollon

1. [Getting started (step by step)](#getting-started-step-by-step)
2. [Getting started from template](#getting-started-from-template)
3. [Quick dive](#quick-dive)
4. [Files](#files)
5. [The logs](#the-logs)
6. [Plugins](#plugins)
7. [Building and production](#building-and-production)
8. [API documentation](#api-documentation)
9. [Usefull links](#usefull-links)

## Getting started (step by step)

Add Apollon to a new project

```bash
npm init
npm install @lymeodev/apollon
```

Apollon 3.0 uses native ESM and so to begin you need to import Apollon in your main file. You then need to tell Apollon where your project root is so it can automatically detect your files. The last step is to start Apollon. It is that easy!

Here is an example:

```javascript
// index.js
import { start, setRootFromUrl, getConfig } from "@lymeodev/apollon";

setRootFromUrl(import.meta.url);

start();
```

or

```javascript
// index.js
import { start, setRootFromUrl } from "@lymeodev/apollon";

start.fromUrl(import.meta.url);
```

All that is left is to create two files. The first is the specification file for example `schema.gql` as shown below:

```gql
// schema.gql
type Query {
    hello: String!
}
```

The second is the implementation named for example `resolvers.js`:

```javascript
// resolvers.js
export default async function(preContext, helpers) {
  this.Query.hello = _ => "Hello world";
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

## Quick dive

### Introduction

Apollon enables you to simply create a GraphQl service/project/API. Most of the complexe GraphQl stuff is managed by [**Apollo**](https://www.apollographql.com/docs/apollo-server/) and not **Apollon**. Apollon's main responsability is to identify, load and then manage files. All are not necessary but there are two basic file types: specification files and the implementation files.

The contents of these files are somewhat normalized so that they can be easily used and understood by Apollon and as of version 3 Apollon identifies 8 different file types:

1. [Specification/Schema files](#specificationschema-files) are used to define the GraphQL schema which happens to be the specification of our API.
2. [Implementation/resolvers files](#implementationresolvers-files) are used to implement the specification by creating the resolvers.
3. [Config files](#config-files) enable to define the settings in Apollon
4. [Connector files](#connector-files) enable to implement connectors (drivers) to access data or storage inside your resolver files
5. [Directive files](#directive-files) are used to define GraphQL directive implementations
6. [Helper files](#helper-files) also enables forwarding implementation to the resolver files
7. [Injector files](#injector-files) are used to change the statefull context object as explained below.
8. [Middleware files](#middleware-files) are used to change the express request, response objects and can catch requests before they enter GraphQl realm.

> Each file is identified by a pattern similar to a regular expression. The default pattern is specified in the associated file documentation in this file.

### Concepts and principles

In these different files 3 objects are widely accessible in Apollon:

1. The `preContext` object (extensive API [here](#precontext-api))
2. The `context` object (extensive API [here](#context-api))
3. The `helpers` object (extensive API [here](#helpers-api))

> The `preContext` object and `context` are very similar. `preContext` is created when Apollon starts. On ea there is a request (_http_ or _ws_) data/implementations are added to a copy of `preContext` called `context`.

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

### Specification/schema files

```javascript
// Default rules
config.sources.schema = "{" +
  "schema/**/*.gql,*.gql," + //Match rules
  "!(node_modules/**/**),!(dist/**/**)" +  //Exclude rules
  "}",

```

The specification files in apollon contains fragments of the standard GraphQL schema. These fragments are written in native GraphQl.

### Implementation/resolvers files

```javascript
// Default rules
config.sources.resolvers =
  "{" +
  "resolvers/**/*.js,*.resolvers.js,resolvers.js," + //Match rules
  "!(node_modules/**/**),!(dist/**/**)" + //Exclude rules
  "}";
```

The implementation files are written using Apollo (https://www.apollographql.com/docs/apollo-server/) logic **but are wrapped for Apollon** in an async function as depicted bellow:

```javascript
// resolvers.js
export async function(preContext, helpers){
    let n = 0

    this.Mutation.test = (parent, params, context, info) => {n+=1; return n};

    this.Query.hello = (parent, params, context, info) => "World";

}
```

> Most functions/files in Apollon can access the **preContext** object through `this` as is binded to the function. **THIS IS NOT THE CASE FOR RESOLVERS WHERE `this` IS BINDED TO THE RESOLVERS**

### Connector files

```javascript
// Default rules
config.sources.connectors =
  "{" +
  "connectors/**/*.js,*.connector.js," + //Match rules
  "!(node_modules/**/**)" + //Exclude rules
  "}";
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
export async function(preContext, helpers){

    this.Query.hello = (parent, params, context, info) => {
        return context.connectors.MongoDB.read();
    }
    this.Query.hello2 = (parent, params, {connectors: {MongoDB}}, info) => {
        return MongoDB.read();
    }

}
```

You are free to implement the connector as you seem fit.

### Config files

```javascript
// Default rules
config.sources.types = "{" +
  "config/**/*.js,*.config.js,config.js," + //Match rules
  "!(node_modules/**/**),!(dist/**/**)" + //Exclude rules
  "}",

```

Config files are implemented in simple js files exporting an object as displayed below:

```javascript
export default {
  port: 3000,
  plugins: [],
  root: "./",

  production: {
    logErrors: false
  },

  //Glob patterns used as sources for the different files
  sources: {
    resolvers: `{resolvers/**/*.js,*.resolvers.js,resolvers.js,${SOURCES_BAN}}`,
    connectors: `{connectors/**/*.js,*.connector.js,${SOURCES_BAN}}`,
    injectors: `{injectors/**/*.js,${SOURCES_BAN}}`,
    directives: `{directives/**/*.js,*.directive.js,${SOURCES_BAN}}`,
    types: `{types/**/*.js,*.type.js,${SOURCES_BAN}}`,
    helpers: `{helpers/**/*.js,*.helper.js,${SOURCES_BAN}}`,
    schema: `{*.gql,schema/**/*.gql,${SOURCES_BAN}}`,
    subscriptions: `subscriptions.js`,
    config: `{config.js,*.config.js,config/**/*.js,${SOURCES_BAN}}`,
    middleware: `{middleware/**/*.js,*.mw.js,${SOURCES_BAN}}`
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
config.sources.types = "{" +
  "middleware/**/*.js,*.mw.js,*.middleware.js," + //Match rules
  "!(node_modules/**/**),!(dist/**/**)" + //Exclude rules
  "}",

```

Middleware files are used in the express app to catch and manage global http or GraphQL behavior. Authentication, file uploading and dynamic request modifications can be done using middleware. Middleware are implemented as follows:

```javascript
// authentication.mw.js
export default async function middlewareWrapper(wrapperContext) {
  return async (request, response, next) => {
    this.logger.debug("Hello world from middleware");
    return next();
  };
}
```

The middleware is wrapped in an async function enabling dynamic generation of the express middleware and contextualised behavior through the **preContext** binded to the wrapper function (hence the access to logger in the example above).

The wrapperContext is passed to the wrapper function enabling to define priority of the middleware as shown bellow:

```javascript
export default async function middlewareWrapper(wrapperContext) {
  wrapperContext.priority = 3;

  return async (request, response, next) => {
    this.logger.debug("Hello world from middleware");
    return next();
  };
}
```

### Type implementation files

```javascript
// Default rules
config.sources.types = "{" +
  "types/**/*.js,*.type.js,*.types.js," + //Match rules
  "!(node_modules/**/**),!(dist/**/**)" + //Exclude rules
  "}",

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

### Directive files

```javascript
// Default rules
config.sources.types = "{" +
  "directives/**/*.js,*.directive.js,*.directives.js," + //Match rules
  "!(node_modules/**/**),!(dist/**/**)" + //Exclude rules
  "}",
```

Directive files enable to implement new directives and are implemented as follows:

```javascript
// trigger.directive.js
import GraphQlTools from "graphql-tools";

class TriggerDirective extends GraphQlTools.SchemaDirectiveVisitor {
  static name = "Trigger";

  visitFieldDefinition(field, { objectType }) {
    let subName = this.args.name;

    const { resolve = defaultFieldResolver } = field;

    field.resolve = async function(parent, params, context) {
      let resolverResult = await resolve.call(this, parent, params, context);

      if (subName && subName != "") {
        const { pubSub } = context;

        pubSub.publish(subName, {
          [subName]: resolverResult
        });
      }

      return resolverResult;
    };
  }
}

export default TriggerDirective;
```

### apollon.yaml file

The `apollon.yaml` file is an additional configuration file. Here is the default values for some of the properties you can define in this file.

```yaml
plugins: {}
playground:
  "editor.cursorShape": "line", // possible values: 'line', 'block', 'underline'
  "editor.fontFamily": `'Source Code Pro', 'Consolas', 'Inconsolata', 'Droid Sans Mono', 'Monaco', monospace`,
  "editor.fontSize": 14,
  "editor.reuseHeaders": true, // new tab reuses headers from last tab
  "editor.theme": "dark", // possible values: 'dark', 'light'
  "general.betaUpdates": false,
  "prettier.printWidth": 80,
  "prettier.tabWidth": 2,
  "prettier.useTabs": false,
  "request.credentials": "omit", // possible values: 'omit', 'include', 'same-origin'
  "schema.polling.enable": true, // enables automatic schema polling
  "schema.polling.endpointFilter": "*localhost*", // endpoint filter for schema polling
  "schema.polling.interval": 2000, // schema polling interval in ms
  "schema.disableComments": boolean,
  "tracing.hideTracingResponse": true
```

> The configuration in this file is loaded under `config.apollon` in the final accessible configuration object

### Subscriptions file

> This file is used to alter default behavior and should be only used if you whish to override it.

```javascript
// Default rules
config.sources.subscription = "subscriptions.js";
```

This file enables to change subscription behavior. From web socket events to context alteration and authentication.

```javascript
import apolloServer from "apollo-server-express";

export default async function(config) {
  return {
    //Web socket events
    onConnect(connectionParams, webSocket, context) {
      console.log("On connect");
    },
    onDisconnect(webSocket, context) {
      console.log("On disconnect");
    },

    //Change subscription context
    context(connection) {
      //Hello key to subscription context
      this.hello = "world";
    },

    //Custum PubSub can use (Redis based, Google, or your own system)
    PubSub: apolloServer.PubSub
  };
}
```

The previous example shows a full alteration of the default behavior. You can also change or return only one of the keys and change just one behavior like this:

```javascript
export default async function(config) {
  return {
    //Web socket events
    onConnect(connectionParams, webSocket, context) {
      console.log("On connect");
    }
  };
}
```

### Injector files

```javascript
// Default rules
config.sources.injectors = "{" +
  "injectors/**/*.js," + //Match rules
  "!(node_modules/**/**),!(dist/**/**)" + //Exclude rules
  "}",

```

Injectors are used to inject data or implementation into the context. Similar to middleware but in the GraphQl realm

> Mutations enable to change low level http transport and are managed by express. They only have access to the `preContext` because they are executed just before the `context` object is created. On the other-hand Injectors are executed inside GraphQl realm and enable access to the `context` object.

```javascript
export default async function() {
  return context => {
    if (context.connection) {
      //Subscription (ws)
      this.logger.info("Subscribtion context injection");
    } else {
      //GraphQL Query/Mutation (http)
      this.logger.info("Query/Mutation context injection");
    }
    context.user = manageUser();
  };
}
```

### Helper files

```javascript
// Default rules
config.sources.helpers = "{" +
  "helpers/**/*.js,*.mw.js," + //Match rules
  "!(node_modules/**/**),!(dist/**/**)" + //Exclude rules
  "}",

```

Helpers are one of the easiest files to understand. Helper files export an async function return an object that is added to the `helpers` global object.

```javascript
export default async function myHelpers() {
  const logger = this.logger;
  return {
    hello() {
      logger.info("Hello world!");
    }
  };
}
```

And can be used as shown below

```javascript
export default async function({ logger }, helpers) {
  function helloWorld() {
    helpers.myHelpers.hello();
    return "Hello world";
  }

  this.Query.hello = helloWorld;
}
```

## Subscriptions

Subscription are enabled by default on Apollon through the apollo-server implementation. Helper functions are available in resolver files through the `helpers` param. You can also access the `PubSub` object through the _context_ and the _preContext_.

```gql
type Query {
  hello: Int!
}

type Subscription {
  counter: Int!
}
```

```javascript
// resolvers.js
export default async function({ pubsub }, { subscriptions }) {
  let counter = 0;

  const channel = subscriptions.create(
    "counter", //channel name

    // A filter publishing only if counter is uneven.
    ({ counter, foo }, variables) => {
      console.log(foo);
      return counter % 2;
    }
  );

  this.Query.hello = async _ => {
    channel.publish(
      ++counter, // Data
      { foo: "bar" } // Metadata
    );
    return counter;
  };
}
```

## File uploading

File uploading is supported and can be implemented as follows:

```gql
# schema file
type File {
  filename: String!
  mimetype: String!
  encoding: String!
}

type Query {
  uploads: [File]
}

type Mutation {
  singleUpload(file: Upload!): File!
}
```

```javascript
// resolvers.js
export async function(preContext, helpers){

    function singleUpload(parent, {file}, context, info){
      return file.then(file => {
        //Contents of Upload scalar: https://github.com/jaydenseric/graphql-upload#class-graphqlupload
        //file.stream is a node stream that contains the contents of the uploaded file
        //node stream api: https://nodejs.org/api/stream.html
        return file;
      });
    }

    this.Mutation.singleUpload = singleUpload;
}
```

## Plugins

Plugins are build Apollon projects that Apollon automatically retrieves it's ressources.

They must be declared in the apollon.yaml file where you can also configure the plugin like shown bellow:

```yaml
plugins:
  - name: apollon-plugin-mongo
```

There are two different ways to install plugins. You can install them as node modules through _git_ or _npm_ or you can install them locally in your project folder.

```yaml
plugins:
  # Module plugins
  - name: apollon-plugin-mongo

  - name: apollon-plugin-redis
    # settings/config
    foo: bar
    redis_usr: root

  # Project folder plugin
  - path: /plugins/apollon-plugin-mongo
```

## Building and production

An Apollon project can be built by defining the env variable `APOLLON_ENV` to `BUILD` as follows:

```sh
env APOLLON_ENV='BUILD' node index.js
```

This should create a dist folder containing the optimised project ready for production. You can launch the built project by launching in the dist folder

```sh
env APOLLON_ENV='PROD' node index.js
```

## API documentation

### preContext API

> The `preContext` object is assemble during the Apollon's boot process. It enables access to different global objects as shown bellow.

`.logger` enables you to access a Bunyan compatible logger used in Apollon. An additional `.logger.domain(msg, ...data)` has been added enabling to log domain events.

`.config` is the final "merged" config object

`.PORT` the final port used for the server

`.ENDPOINT` the final endpoint the http API will be available

`.app` the express app used to expose the API

`.plugins` the different Apollon plugins loaded during boot process

`.schema` the GraphQl schema containing the resolvers, schemaDirectives, typeDefs

`.serverOptions` contains the server options sent to the GraphQL server Apollo and **not Apollon**

### context API

> Needs more information

### helpers API

> Needs more information

# Usefull links

- [Top of this page](#apollon)
- [Apollo Server Documentation](https://www.apollographql.com/docs/apollo-server/)

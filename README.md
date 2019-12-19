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
npm install @lymeodev/apollon@2.0.0-1
```

> At this time Apollon is still in prerelease before installing please check latest version available here https://www.npmjs.com/package/@lymeodev/apollon. The package is often updated.

Apollon 2.0 uses native ESM and so to begin you need to import Apollon in your main file. You then need to tell Apollon where your project root is so it can automatically detect your files. The last step is to start Apollon. It is that easy!

Here is an example:

```javascript
//index.js
import {start, setConfig, config} from "@lymeodev/apollon";
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

setConfig({root: __dirname});

start();
```

All that is left is to create your two files. The first is the specification file for example `schema.gql` as shown below:

```gql
type Query {
    hello: String!
}
```

The second is the implementation named for example `resolvers.js`:
```javascript
export default async function({Query}){
    Query.hello = _ => "Hello world"
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

Apollon uses Bunyan as the native logging mecanism. To view logs in a "pretty" you can install bunyan with npm

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
Apollon simplifies GraphQl API development mainly by loading and managing files for you. Different files are needed to make your API function and are used at different moments. All are not necessary but two basic files types are: specification files and the implementation files.
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
config.sources.resolvers = "{"
                            //Match rules
                            + "resolvers/**/*.js,"
                            + "*.resolver.js,"
                            + "resolver.js,"
                            + "*.resolvers.js,"
                            + "resolvers.js," 

                            //Exclude rules
                            + "!(node_modules/**/**)" + "}"
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
> Connectors enable you to seperate request and data processing from data storage or access.

```
export default async function(){
    let mongoDBConnector = {
        mongo: function mongo(){
            return "stuff"
        } 
    };
    return mongoDBConnector;
}
```

### Config files
> Content comming soon

### Middleware files
> Content comming soon

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
> Content comming soon

### Directive implementation files
> Content comming soon

## Plugins

> Content comming soon

## Building

> Content comming soon
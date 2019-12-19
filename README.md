# Apollon: an Apollo/express based graphQl server

## Getting started

Add apollon to a new project

```bash
npm init
npm install @lymeodev/apollon@2.0.0-0
```

> At this time apollon is still in prerelease before installing please check latest version available here https://www.npmjs.com/package/@lymeodev/apollon. The package is often updated.

Apollon 2.0 uses native ESM and so to begin using Apollon you need to import it in your main file. You then need to tell Apollon where your project root is so apollon can automatically detect your files. The last step is to start Apollon. It is that easy!

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
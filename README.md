## Presentation

Project apollon's goal is to simplify GraphQl API development and to offer a modulable structure to start building an API in minutes.

It is based on the apollo server library that can be found [here](https://github.com/apollographql/apollo-server).

Some of the features:

* Authentication and initialization hook
* GraphQl playground to test and interact with your API
* Subscriptions for real time synchronisation with the API
* Clean working structure separating resolvers, schema, connectors, directives and types
* JSON logging, ready for your favorite log aggregation tool

## Requirements

Essential

* NodeJs (minimum v10) or Docker

Optional

* [Bunyan cli tool](https://github.com/trentm/node-bunyan)
* [Nodemon cli tool](https://github.com/remy/nodemon)

## Getting started

Go to our [releases page](https://github.com/lymeo/apollon/releases/) and download your desired version. Unzip the sources if you have downloaded an archive go to the root of the project where there is a `package.json` file. Depending on your package manager enter one of the following commands:

```shell
npm i
```

```shell
yarn
```

Once the installation completed enter the following command:

```shell
npm run dev
```

If (we recommend) you have the bunyan cli tool you could also enter this command for prettier logs

```shell
npm run dev | bunyan
```

After a couple of milliseconds your server should be up and running

## The schema

The GraphQl schema in **apollon**  is seperated into different files inside the root `schema` directory. You can generate a full schema if needed with the following command 

```
npm run schema
```

And will find the resulting file in a new root `dist`  directory.

## The resolvers

> You can access the context object in most scopes in apollon. It contains usefull elements to access global objects.

Resolvers are implemented in the resolver directory and are defined in an exported javascript function:

```javascript
module.exports = function(schema, helpers) {

};
```

Apollon passes into this function the current schema implementation and and object containing helpers.

The schema implementation contains three keys that are used to implement the specification schema.

```javascript
schema.Query;
schema.Mutation;
schema.Subscription;
```

A resolver example:

```javascript
module.exports = function(schema, helpers) {

    let {Query, Mutation} = schema;


    // Type 

    schema.Comment = {
        author: (root, _, {connectors: { local } }) => {
            return local.users.filter(user => user.id == root.author)[0];
        },
 
    }


    // Queries

    Query.comments = (root, _, {connectors: { local }}) => {
        return local.comments;
    }


    // Mutations

    Mutation.comment_delete = (root, { id }, {connectors: {local}}) => {
        local.comments = local.comments.filter(comment => comment.id != id);
        return id;
    }

    new helpers.SimpleSubscription("comment_deleted");
};
```

## The connectors

The connectors are used inside the app to access data sources. They are defined in the root `connectors`  directory.

Each file is added to the `context.connectors` object based on it's file name and whatever the exported asynchronous function returns is there on out used as the actual connector

Example:

```javascript
let users = [
  {
    id: '0',
    name: 'Homer'
  },
  {
    id: '1',
    name: 'Bart'
  },
  {
    id: '2',
    name: 'Moe'
  }
];

let comments = [
  {
    id: '0',
    content: "Je suis un commentaire",
    author: '0',
  },
  {
    id: '1',
    content: "Mais non tu es Homer !",
    author: '1',
  },
  {
    id: '2',
    content: "Ah",
    author: '2',
  },
  {
    id: '3',
    content: "...",
    author: '1'
  }
]


module.exports = async function() {
  return {
    users,
    comments
  };
```

> This could have exported any other king of data source for example a MySql connection or a Mongoose client

## The src root directory

This directory contains apollon's code. Nothing magic a simple express server with the different middleware feel free to change whatever you want or to make a PR if a feature seems interesting.

## Demo

A demo project using subscriptions and the apollo client is also available on a release page please check it out if you need more details. You can alternatively browse the source code on [the demo branch](https://github.com/lymeo/apollon/tree/demo).
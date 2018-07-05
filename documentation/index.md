# Getting Started

These informations will introduce you the different folders in the Userland

## config

In this folder, you can place all your configuration files, in the example, there is a configuration file for the cors and the endpointURL

## connectors

In this folder, you can set the connectors to access to your database and create your database. In the example, a local database containing 3 objects is created 

## dao

In this folder, you can describe the interactions of your requests with your database, so you can define different types of database and handle all the specific requests there 

## directives

In this folder, you can set your directives, a directive is an identifier preceded by a @, which can be followed by a list of arguments and can appear after almost any form of syntax in the GraphQL schema

## helpers

In this folder, you can define different function to help you in your development

## other

In this folder, you can place other things that do not match with the other folders

## resolvers

In this folder, you can define your resolvers, which are defined separately from the schema with GraphQL, because the schema already describes fields, arguments and return types. The resolvers are functions called to execute these fields

## ressources

In this folder, you can place all the ressources that you need

## schema

In this folder, you can describe your schema. A GraphQL schema is at the center of any GraphQL server implementation and describes the functionality available to the clients which connect to it. You can set in this directory your queries, mutations, inputs and so on...

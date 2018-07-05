# Apollon

Apollon is a "clone and play" project to create GraphQl api's.

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development. 

### Prerequisites

You will need NodeJs or Docker to run this project.

* [nodejs](https://nodejs.org/en/download/)

### Launching apollon for the first time

```
git clone https://github.com/lymeo/apollon.git
cd apollon
npm install
npm run dev
```

### Generate GraphQL schema

The Graphql Schema in apollon is seperated into different files slightly reducing one of the initial advantages of a schema (all the specification in one place). To concatenate the schema files and generate a single file you can use the following command

```
npm run schema
```



## Built With

* [GraphQL](https://graphql.org/)
* [Apollo GraphQL](https://www.apollographql.com/)

const resolvers = require('./resolvers');
const fs = require("fs");
const path = require("path");


// Reading schema file
let typeDefs = "";

typeDefs += fs.readFileSync(path.join(__dirname, "../schema/directives.gql"), {
  encoding: "utf8"
});
typeDefs += "\n" + fs.readFileSync(path.join(__dirname, "../schema/types.gql"), {
  encoding: "utf8"
});
typeDefs += "\n" + fs.readFileSync(path.join(__dirname, "../schema/queries.gql"), {
  encoding: "utf8"
});
typeDefs += "\n" + fs.readFileSync(path.join(__dirname, "../schema/mutations.gql"), {
  encoding: "utf8"
});
typeDefs += "\n" + fs.readFileSync(path.join(__dirname, "../schema/inputs.gql"), {
  encoding: "utf8"
});
// typeDefs += "\n" + fs.readFileSync(path.join(__dirname, "../schema/subscriptions.gql"), {
//   encoding: "utf8"
// });

let schemaDirectives = {
}

// Generate the schema object from schema file and definition.
module.exports = {typeDefs,resolvers, schemaDirectives};

const fs = require("fs");
const path = require("path");
const schema = require("./schema");

const dir = path.join(__dirname, '../dist');

if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
    console.log("The 'dist' folder was created at the root of the project")
}

let fileName = process.argv[2] || `schema.gql`;

if (!fileName.endsWith('.gql')) {
    fileName += ".gql"
}

fs.writeFile(`${dir + '/' +fileName}`, schema.typeDefs, function (err) {
    if (err) throw err;

    console.log(`The schema '/dist/${fileName}' was created.`);
});
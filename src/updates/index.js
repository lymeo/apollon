console.log("Preparing for update ...");
const shell = require('shelljs');
const path = require('path');
const beautify = require('json-beautify');
const {version} = require("../../package.json");

let sourcePath = path.join(shell.pwd().toString(), process.argv[2]);

const oldPackageJson = require(path.join(sourcePath, "./package.json"));
console.log(`Upgrading from version ${oldPackageJson.version} to ${version}`);

require("./previous")(oldPackageJson.version, sourcePath);

console.log("WARNING: You will need to add your custom dependencies to the package.json")
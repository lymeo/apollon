console.log("Preparing for update ...");
const shell = require('shelljs');
const path = require('path');
const {version} = require("../../package.json");

let sourcePath = path.join(shell.pwd().toString(), process.argv[2]);

const {version: oldVersion} = require(path.join(sourcePath, "./package.json"));
console.log(`Upgrading from version ${oldVersion} to ${version}`);

require("./previous")(oldVersion, sourcePath);
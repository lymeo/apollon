const shell = require('shelljs');
const path = require('path');
const util = require('util');
const fs = require('fs');

module.exports = async function(version, source){
    const USERLAND_FILES = {
        "./config/*": "./config/",
        "./schema/*": "./schema/",
        "./resolvers/*": "./resolvers/",
        "./other/*": "./other/",
        "./directives/*": "./directives/",
        "./types/*": "./types/",
        "./tests/*": "./tests/",
        "./connectors/*": "./connectors/"
    };

    const DEFAULT_FILES = [
        "./resolvers/example.js",
        "./types/Object.js",
        "./types/Upload.js",
        "./directives/trigger.js",
        "./connectors/local.js"
    ];

    shell.rm(DEFAULT_FILES.map(e => path.join(__dirname, "../../../", e)));

    for (const spath in USERLAND_FILES) {
        shell.cp("-r", path.join(source, spath), path.join(__dirname, "../../../", USERLAND_FILES[spath]));
    }

    console.log(await util.promisify(fs.readFile)(path.join(__dirname, "./release.md"), "utf8"))
}
const shell = require('shelljs');
const path = require('path');

module.exports = async function(version, source){
    const USERLAND_FILES = {
        "./config/*": "./config/",
        "./schema/*": "./schema/",
        "./resolvers/*": "./resolvers/",
        "./other/*": "./other/",
        "./directives/*": "./directives/",
        "./types/*": "./types/",
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
        shell.cp(path.join(source, spath), path.join(__dirname, "../../../", USERLAND_FILES[spath]));
    }
}
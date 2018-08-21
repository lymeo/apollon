const shell = require('shelljs');

module.exports = async function(version, source){
    const USERLAND_FILES = [
        "./schema/*",
        "./config/*",
        "./resolvers/*",
        "./other/*",
        "./directives/*",
        "./types/*",
        "./connectors/*"
    ];

    const DEFAULT_FILES = [
        "./resolvers/example.js",
        "./types/Object.js",
        "./types/Upload.js",
        "./directives/trigger.js",
        "./connectors/local.js"
    ];

    shell.rm(DEFAULT_FILES.map(e => path.join(__dirname, "../../../", e)));

    for (const ufpath of USERLAND_FILES) {
        shell.cp(path.join(source, ufpath), path.join(__dirname, "../../../", ufpath));
    }
}
import { dirname } from "path";
import { fileURLToPath } from "url";
import server from "./utils/server.js";

//Custom imports
import ENVIRONMENT from "./utils/getEnv.js";

let config = {
  ENV: ENVIRONMENT
};
let preContext;

// # Helper functions for setting root
const setRootFromUrl = function(url) {
  config.root = dirname(fileURLToPath(url));
};

/**
 * Function enabling to configure the root url and start Apollon
 * @param {String} url // Defines the root directory for resolving file paths in Apollon (generally import.meta.url)
 */
async function startFromUrl(url) {
  setRootFromUrl(url);
  return await start();
}

/**
 * Function enabling to configure the root url and start Apollon
 * @param {String} url // Defines the root directory for resolving file paths in Apollon (generally import.meta.url)
 */
async function prepareFromUrl(url) {
  setRootFromUrl(url);
  return await prepare();
}

// # Controlled getters
function getConfig() {
  return config;
}

function getPreContext() {
  if (context) {
    return context;
  } else {
    throw "Context can only be accessed after start/boot process";
  }
}

function getEnv() {
  return ENVIRONMENT;
}

/**
 * Launches apollon server
 * @returns preContext
 */
async function start() {
  const env = await import(`./${ENVIRONMENT}.js`);

  preContext = await env.default(config);

  await expose(preContext);

  return preContext;
}
start.fromUrl = startFromUrl;

async function prepare() {
  const env = await import(`./${ENVIRONMENT}.js`);

  preContext = await env.default(config);

  return preContext;
}
prepare.fromUrl = prepareFromUrl;

async function expose(preContext) {
  if (preContext.serverOptions) {
    await server.call(preContext);
  }
}

export {
  start,
  setRootFromUrl,
  getConfig,
  getPreContext,
  getEnv,
  prepare,
  expose
};
export default {
  start,
  setRootFromUrl,
  getConfig,
  getPreContext,
  getEnv,
  prepare,
  expose
};

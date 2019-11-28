require = require("@std/esm")(module, { cjs: true, await: true });
require("@babel/polyfill");
require("@babel/register");
require("@babel/plugin-proposal-pipeline-operator");
require("babel-plugin-transform-function-bind");

const bootFiles = {
  dev: "./develop.mjs",
  develop: "./develop.mjs",
  development: "./develop.mjs",
  production: "./prod.mjs",
  prod: "./prod.mjs",
  build: "./build.mjs"
};

global.ENV = (
  process.env.APOLLON_ENV ||
  process.env.NODE_ENV ||
  "dev"
).toLowerCase();

if (!bootFiles[global.ENV]) {
  global.ENV = "dev";
}
const { start, setConfig, config } = require(bootFiles[global.ENV]);

module.exports = {
  start,
  setConfig,
  config
};

require = require("@std/esm")(module, { cjs: true, await: true });
require("@babel/polyfill");
require("@babel/register");
require("@babel/plugin-proposal-pipeline-operator");
require("babel-plugin-transform-function-bind");

const mod = process.env.BUILD ? "./build.mjs" : "./server.mjs";
const { start, setConfig, config } = require(mod);

module.exports = {
  start,
  setConfig,
  config
};

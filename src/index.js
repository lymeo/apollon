require("@babel/polyfill");
require("@babel/register");
require("@babel/plugin-proposal-pipeline-operator");
require("babel-plugin-transform-function-bind");
require = require("@std/esm")(module, { mode: "auto", cjs: true, await: true });

const mod = process.env.BUILD ? "./build.mjs" : "./apollon.mjs";
const { start, setConfig, config } = require(mod);

module.exports = {
  start,
  setConfig,
  config
};

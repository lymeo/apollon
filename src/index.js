import devEnv from "./develop.js";
import buildEnv from "./build.js";
import prodEnv from "./prod.js";
import { dirname } from "path";
import { fileURLToPath } from "url";

const envDictionary = {
  dev: "develop",
  develop: "develop",
  development: "develop",
  production: "prod",
  prod: "prod",
  build: "build"
};

global.ENV = (
  process.env.APOLLON_ENV ||
  process.env.NODE_ENV ||
  "dev"
).toLowerCase();

if (!envDictionary[global.ENV]) {
  global.ENV = "dev";
}
const { start, setConfig, config } = {
  develop: devEnv,
  prod: prodEnv,
  build: buildEnv
}[envDictionary[global.ENV]];

const setRootFromUrl = function(url) {
  setConfig({ root: dirname(fileURLToPath(url)) });
};

export { start, setRootFromUrl, setConfig, config };

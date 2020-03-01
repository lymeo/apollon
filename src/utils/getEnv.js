const ENVS = {
  dev: "develop",
  develop: "develop",
  development: "develop",
  production: "prod",
  prod: "prod",
  build: "build"
};

const env = (
  process.env.APOLLON_ENV ||
  process.env.NODE_ENV ||
  "develop"
).toLowerCase();

if (!ENVS[env]) {
  global.ENV = "develop";
} else {
  global.ENV = ENVS[env];
}

export default global.ENV;

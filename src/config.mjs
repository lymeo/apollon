let root = __dirname.replace("node_modules/@lymeodev/apollon/src", "");

const config = {
  port: 3000,
  plugins: [],
  root,

  //Glob patterns used as sources for the different files
  sources: {
    resolvers:
      "{resolvers/**/*.js,*.resolver.js,resolver.js,!(node_modules)/*.resolver.js,*.resolvers.js,resolvers.js,!(node_modules)/*.resolvers.js}",
    connectors:
      "{connectors/**/*.js,*.connector.js,!(node_modules)/*.connector.js,*.connectors.js,!(node_modules)/*.connectors.js}",
    directives:
      "{directives/**/*.js,!(node_modules)/*.directive.js,*.directive.js,!(node_modules)/*.directives.js,*.directives.js}",
    types:
      "{types/**/*.js,!(node_modules)/*.type.js,*.type.js,!(node_modules)/*.types.js,*.types.js}",
    schema: "{*.gql, !(node_modules)/*.gql}",
    config:
      "{config.js,config.json,*.config.js,*.config.json,config/**/*.js,config/**/*.json,!(node_modules/**/*)}",
    middlewares: "{middlewares/**/*.js,!(node_modules/**/*)}"
  },

  //Default CORS settings
  cors: {
    origin: "*",
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    preflightContinue: false,
    optionsSuccessStatus: 204
  },

  //Default hooks
  async initialisation(context, start) {
    start();
  }
};

export default config;

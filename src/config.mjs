const root = __dirname.replace("node_modules/@lymeodev/apollon/src", "");

export default {
  port: 3000,
  plugins: [],
  root,

  //Glob patterns used as sources for the different files
  sources: {
    resolvers:
      "{resolvers/**/*.js,*.resolver.js,resolver.js,*.resolvers.js,resolvers.js,resolvers/**/*.mjs,*.resolver.mjs,resolver.mjs,*.resolvers.mjs,resolvers.mjs,!(node_modules/**/**)}",
    connectors:
      "{connectors/**/*.js,*.connector.js,,*.connectors.js,connectors/**/*.mjs,*.connector.mjs,,*.connectors.mjs,!(node_modules/**/**)}",
    directives:
      "{directives/**/*.js,*.directive.js*.directives.js,directives/**/*.mjs,*.directive.mjs*.directives.mjs,!(node_modules/**/**)}",
    types:
      "{types/**/*.js,*.type.js,*.types.js,types/**/*.mjs,*.type.mjs,*.types.mjs,!(node_modules/**/**)}",
    schema: "{*.gql, !(node_modules)/*.gql}",
    config:
      "{config.js,config.mjs,config.json,*.config.js,*.config.mjs,*.config.json,config/**/*.js,config/**/*.mjs,config/**/*.json,!(node_modules/**/**)}",
<<<<<<< HEAD
    middlewares:
      "{middleware/**/*.js,middleware/**/*.mjs,*.mw.mjs,,*.mw.js,!(node_modules/**/**)}"
=======
    middlewares: "{middlewares/**/*.js,!(node_modules/**/**)}"
>>>>>>> c96b2d1621b4baeb271d139c7a77098ced301edc
  },

  //Default CORS settings
  cors: {
    origin: "*",
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    preflightContinue: false,
    optionsSuccessStatus: 204
  }
};

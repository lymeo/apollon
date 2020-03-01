const SOURCES_BAN = "!(node_modules/**/**),!(dist/**/**)";

export default {
  port: 3000,
  plugins: [],
  root: "./",

  production: {
    logErrors: false
  },

  //Glob patterns used as sources for the different files
  sources: {
    resolvers: `{resolvers/**/*.js,*.resolvers.js,resolvers.js,${SOURCES_BAN}}`,
    connectors: `{connectors/**/*.js,*.connector.js,${SOURCES_BAN}}`,
    injectors: `{injectors/**/*.js,${SOURCES_BAN}}`,
    directives: `{directives/**/*.js,*.directive.js,${SOURCES_BAN}}`,
    types: `{types/**/*.js,*.type.js,${SOURCES_BAN}}`,
    helpers: `{helpers/**/*.js,*.helper.js,${SOURCES_BAN}}`,
    schema: `{*.gql,schema/**/*.gql,${SOURCES_BAN}}`,
    subscriptions: `subscriptions.js`,
    config: `{config.js,*.config.js,config/**/*.js,${SOURCES_BAN}}`,
    middleware: `{middleware/**/*.js,*.mw.js,${SOURCES_BAN}}`
  },

  //Default CORS settings
  cors: {
    origin: "*",
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    preflightContinue: false,
    optionsSuccessStatus: 204
  }
};

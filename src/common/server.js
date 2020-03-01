import bodyParser from "body-parser";
import http from "http";
import cors from "cors";

// CJS compatibility
import apollo_server_express from "apollo-server-express";
const { ApolloServer } = apollo_server_express;

export default async function(logger, middleware) {
  const server = new ApolloServer(this.serverOptions);
  this.app.use(cors(this.config.cors));
  this.app.use(this.config.endpoint || "/", bodyParser.json(), ...middleware);
  server.applyMiddleware({
    app: this.app,
    path: this.config.endpoint || "/"
  });
  logger.debug("- Configured the main endpoint", {
    endpoint: this.config.endpoint || "/"
  });

  const httpServer = http.createServer(this.app);
  server.installSubscriptionHandlers(httpServer);

  this.server = server;

  httpServer.listen(this.PORT, () => {
    logger.info(
      {
        url: `http://localhost:${this.PORT}${server.graphqlPath}`
      },
      `- Main endpoint is ready`
    );
    logger.info(
      {
        url: `ws://localhost:${this.PORT}${server.subscriptionsPath}`
      },
      `- Subscriptions endpoint is ready`
    );
  });

  return server;
}

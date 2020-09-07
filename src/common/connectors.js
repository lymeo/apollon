import path from "path";
import logger from "../common/logger.js";
import { pathToFileURL } from "url";

export default async function() {
  // Importing connectors
  logger.debug("--- Setting up Apollon connectors");
  const connectorImports = await Promise.all(
    this.config.$apollon_project_implementations.connectors.map(p =>
      import(pathToFileURL(path.join(process.cwd(), p)))
    )
  );

  //Initialization of connectors
  logger.debug("--- Initialisation of the connectors");
  const connectors = {};
  for (const connectorIndex in connectorImports) {
    const connector = connectorImports[connectorIndex];
    if (!connector.default || !connector.default.name) {
      logger.error(
        `Connector (${this.config.$apollon_project_implementations.connectors[connectorIndex]}) is malformed or has no name`
      );
      process.exit(1);
    } else if (
      connector.default.name == "default" ||
      connector.default.name == ""
    ) {
      logger.warn(
        `No name defined for connector ${this.config.$apollon_project_implementations.connectors[connectorIndex]} "default" will be used`
      );
    }
    connectors[connector.default.name] = await connector.default.call(this);
  }

  return connectors;
}

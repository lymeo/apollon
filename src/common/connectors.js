export default async function() {
  // Importing connectors
  this.logger.debug("--- Setting up Apollon connectors");
  const connectorImports = await Promise.all(
    this.config.$apollon_project_implementations.connectors.map(p => import(p))
  );

  //Initialization of connectors
  this.logger.debug("--- Initialisation of the connectors");
  const connectors = {};
  for (let connector of connectorImports) {
    if (!connector.default.name) throw "No name defined for connector";
    connectors[connector.default.name] = await connector.default.call(this);
  }

  //Manage connectors from plugins
  for (let pluginName in this.plugins) {
    if (this.plugins[pluginName].connectors) {
      for (let connectorName in this.plugins[pluginName].connectors) {
        connectors[
          (this.config.apollon.plugins[pluginName].connector_prefix || "") +
            connectorName
        ] = await this.plugins[pluginName].connectors[connectorName].call(this);
      }
    }
  }

  return connectors;
}

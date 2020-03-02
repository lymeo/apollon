import path from "path";

export default async function() {
  const injectors = [];
  // Importing connectors
  this.logger.debug("--- Setting up injectors");
  const injectorImports = await Promise.all(
    this.config.$apollon_project_implementations.injectors.map(p =>
      import(path.join(process.cwd(), p))
    )
  );

  //Initialization of injectors
  this.logger.debug("--- Initialisation of the injectors");
  for (let injector of injectorImports) {
    injectors.push(await injector.default.call(this));
  }

  this.logger.debug(
    "--- Retrieving injectors for context injection from plugins"
  );
  for (let pluginName in this.plugins) {
    if (
      this.plugins[pluginName].injectors &&
      this.config.apollon.plugins[pluginName].priviledged
    ) {
      injectors.push(...this.plugins[pluginName].injectors);
    }
  }

  return injectors;
}

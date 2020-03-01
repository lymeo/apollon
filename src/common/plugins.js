import path from "path";

export default async function() {
  let plugins = {};
  let plugin_middlewares = [];
  if (this.config.apollon && this.config.apollon.plugins) {
    this.logger.info("Loading plugins");
    for (const plugin in this.config.apollon.plugins) {
      this.logger.debug(
        `- Importing plugin ${this.config.apollon.plugins[plugin].path ||
          path.join(process.cwd(), "./node_modules/", plugin, "./index.js")}`
      );
      plugins[plugin] = import(
        this.config.apollon.plugins[plugin].path ||
          path.join(process.cwd(), "./node_modules/", plugin, "./index.js")
      );
    }
    for (const plugin in plugins) {
      plugins[plugin] = await (await plugins[plugin]).default(
        this.config.apollon.plugins[plugin]
      );
      if (this.config.apollon.plugins[plugin].alias) {
        plugins[this.config.apollon.plugins[plugin].alias.toString()] =
          plugins[plugin];
      }
      plugin_middlewares.push(...(plugins[plugin].middleware || []));
    }
  }
  return { plugins, plugin_middlewares };
}

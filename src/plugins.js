import path from "path";

export default async function(config) {
  let plugins = {};
  let plugin_middlewares = [];
  if (config.apollon && config.apollon.plugins) {
    logger.info("Loading plugins");
    for (const plugin in config.apollon.plugins) {
      logger.debug(
        `- Importing plugin ${config.apollon.plugins[plugin].path ||
          path.join(process.cwd(), "./node_modules/", plugin, "./index.js")}`
      );
      plugins[plugin] = import(
        config.apollon.plugins[plugin].path ||
          path.join(process.cwd(), "./node_modules/", plugin, "./index.js")
      );
    }
    for (const plugin in plugins) {
      plugins[plugin] = await (await plugins[plugin]).default(
        config.apollon.plugins[plugin]
      );
      if (config.apollon.plugins[plugin].alias) {
        plugins[config.apollon.plugins[plugin].alias.toString()] =
          plugins[plugin];
      }
      plugin_middlewares.push(...(plugins[plugin].middleware || []));
    }
  }
  return { plugins, plugin_middlewares };
}

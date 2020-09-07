import path from "path";
import logger from "./logger.js";
import fse from "fs-extra";
import { pathToFileURL } from "url";

export default async function() {
  const plugins = {};
  if (this.config.apollon && this.config.apollon.plugins) {
    for (const pluginSource of this.config.apollon.plugins) {
      let plugin = Object.assign({}, pluginSource);
      plugin.path = plugin.path || "/";
      plugin.source = plugin.source || (plugin.name ? "module" : "project");
      if (plugin.source == "module") {
        if (!plugin.name) {
          logger.error("A plugin type module must have a name specified");
          process.exit(1);
        }
        plugin._relativePath = path.join("./node_modules", plugin.name);
      } else {
        plugin._relativePath = "./";
      }
      plugin._rootPath = path.join(plugin._relativePath, plugin.path);
      plugin._configPath = path.join(plugin._rootPath, "config.js");
      logger.debug(
        `--- Loading ${plugin.source} plugin ${plugin.name || plugin.path}`
      );
      if (!(await fse.exists(plugin._configPath))) {
        logger.warn(
          `--- Plugin ${plugin.name ||
            plugin.path} config file could not be found`,
          { path: plugin._configPath }
        );
        continue;
      }

      try {
        plugin._import = await import(
          pathToFileURL(path.join(process.cwd(), plugin._configPath))
        );
      } catch (e) {
        logger.error(e, "--- Could not import plugin");
        process.exit(1);
      }

      if (
        plugin._import &&
        plugin._import.default &&
        plugin._import.default.$apollon_project_implementations
      ) {
        plugin.ressources =
          plugin._import.default.$apollon_project_implementations;
      } else {
        logger.error("--- The imported plugin is not a built Apollon project");
        process.exit(1);
      }

      this.config.$apollon_project_implementations.schema.push(
        path.join(plugin._rootPath, "schema.gql")
      );
      for (let type of [
        "types",
        "directives",
        "middleware",
        "resolvers",
        "helpers",
        "connectors",
        "injectors"
      ]) {
        if (plugin.ressources[type] && plugin.ressources[type].length) {
          plugin.ressources[type] = plugin.ressources[type].map(ppath =>
            path.join(plugin._rootPath, ppath)
          );
          this.config.$apollon_project_implementations[type].push(
            ...plugin.ressources[type]
          );
        }
      }

      if (plugin._import.default.pluginName) {
        plugins[plugin._import.default.pluginName] = plugin;
      } else {
        logger.warn("Plugin has no name", plugin._import.default);
      }
      delete plugin._import;
    }
  }
  return plugins;
}

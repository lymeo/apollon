import subscriptionsHelper from "../helpers/subscriptions.js";
import path from "path";
import logger from "./logger.js";

export default async function(resolvers) {
  const helpers = {};
  // Manage default helpers
  Object.assign(helpers, {
    subscriptions: await subscriptionsHelper.call(this, resolvers)
  });

  // Manage custom helpers
  const helperImports = await Promise.all(
    this.config.$apollon_project_implementations.helpers.map(p =>
      import(path.join(process.cwd(), p))
    )
  );

  //Initialization of helpers
  logger.debug("--- Initialisation of the helperss");
  for (let helper of helperImports) {
    if (!helper.default.name) throw "No name defined for connector";
    if (helper.default.name == "default" || helper.default.name == "")
      logger.warn(
        "No name defined for helpers. Please provide by naming the exported function. For now the name 'default' will be used."
      );
    helpers[helper.default.name] = await helper.default.call(this, resolvers);
  }

  return helpers;
}

import subscriptionsHelper from "../helpers/subscriptions.js";

export default async function(resolvers) {
  const helpers = {};
  // Manage default helpers
  Object.assign(helpers, {
    subscriptions: await subscriptionsHelper.call(this, resolvers)
  });

  // Manage custom helpers
  const helperImports = await Promise.all(
    this.config.$apollon_project_implementations.helpers.map(p => import(p))
  );

  //Initialization of helpers
  this.logger.debug("--- Initialisation of the helperss");
  for (let helper of helperImports) {
    if (!helper.default.name) throw "No name defined for connector";
    helpers[helper.default.name] = await helper.default.call(this, resolvers);
  }

  return helpers;
}

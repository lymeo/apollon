import fse from "fs-extra";
import graphqlMerge from "merge-graphql-schemas";
import path from "path";
import logger from "../common/logger.js";

export default async function() {
  const plugins = this.plugins;
  const filepaths = this.config.$apollon_project_implementations.schema;

  const typeDefs = await Promise.all(
    filepaths.map(filepath =>
      fse.readFile(path.join(process.cwd(), filepath), "utf8")
    )
  );

  for (let pluginName in plugins) {
    if (plugins[pluginName].specs) {
      typeDefs.push(...plugins[pluginName].specs);
    }
  }

  // Avoid dummy Query for root type Query
  typeDefs.push(`type Query {
  _service: String!
}`);

  try {
    return graphqlMerge.mergeTypes(typeDefs, { all: true });
  } catch (err) {
    logger.error(
      err,
      "An error occurred. This is often due to empty or malformed specification files"
    );
    process.exit(1);
  }
}

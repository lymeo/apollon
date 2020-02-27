import fse from "fs-extra";
import graphqlMerge from "merge-graphql-schemas";

export default async function(filepaths, plugins) {
  const typeDefs = await Promise.all(
    filepaths.map(filepath => fse.readFile(filepath, "utf8"))
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

  return graphqlMerge.mergeTypes(typeDefs, { all: true });
}

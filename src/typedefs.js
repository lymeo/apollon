import fse from "fs-extra";
import graphqlMerge from "merge-graphql-schemas";

export default async function(filepaths, plugins) {
  const files = await Promise.all(
    filepaths.map(filepath => fse.readFile(filepath, "utf8"))
  );

  for (let pluginName in plugins) {
    if (plugins[pluginName].specs) {
      files.push(...plugins[pluginName].specs);
    }
  }

  return graphqlMerge.mergeTypes(files, { all: true });
}

import logger from "./logger.js";

export default async function() {
  logger.debug(`- Compiling directive implementations`);
  let directives = {};
  let asyncBuffer = this.config.$apollon_project_implementations.directives.map(
    filepath => {
      const impl = import(path.join(process.cwd(), filepath));
      impl.filepath = filepath;
      logger.trace({ filepath }, `-- Included directive implementation`);
      return impl;
    }
  );

  //wait for all async imports and map them to directives variable
  const directiveImplementations = await Promise.all(asyncBuffer);
  directiveImplementations.forEach((e, i) => {
    if (e.default && e.default.name) {
      directives[e.default.name] = e.default;
    } else {
      logger.error(
        `Directive (${asyncBuffer[i].filepath}) could not be used. Please refer to documentation.`
      );
      process.exit(1);
    }
  });

  return directives;
}

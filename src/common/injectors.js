import path from "path";
import logger from "./logger.js";
import { pathToFileURL } from "url";

export default async function() {
  const injectors = [];
  // Importing connectors
  logger.debug("--- Setting up injectors");
  const injectorImports = await Promise.all(
    this.config.$apollon_project_implementations.injectors.map(p =>
      import(pathToFileURL(path.join(process.cwd(), p)))
    )
  );

  //Initialization of injectors
  logger.debug("--- Initialisation of the injectors");
  for (let injector of injectorImports) {
    if (!injector.default || !injector.default.call) {
      logger.error(
        "The injector file must export a function returning the injector "
      );
      process.exit(1);
    }
    injectors.push(await injector.default.call(this));
  }

  return injectors;
}

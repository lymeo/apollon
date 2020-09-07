import path from "path";
import logger from "./logger.js";
import { pathToFileURL } from "url";

export default async function() {
  const preContext = this;

  const middlewareWrappers = (await Promise.all(
    this.config.$apollon_project_implementations.middleware.map(p =>
      import(pathToFileURL(path.join(process.cwd(), p)))
    )
  )).map(e => e.default);

  const futurMiddleware = middlewareWrappers
    .map(wrapper => {
      if (!wrapper || !wrapper.call) {
        logger.error(
          "The middleware file must export a function returning the final express middleware"
        );
        process.exit(1);
      }
      const wrapperInfo = { priority: 0 };
      let middleware = wrapper.call(preContext, wrapperInfo);
      middleware.wrapperInfo = wrapperInfo;
      return middleware;
    })
    .sort((a, b) => a.wrapperInfo.priority - b.wrapperInfo.priority, 0);

  return await Promise.all(futurMiddleware);
}

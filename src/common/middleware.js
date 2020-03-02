import path from "path";
import logger from "./logger.js";

export default async function(plugin_middlewares) {
  const preContext = this;

  const middlewareWrappers = (
    await Promise.all(
      this.config.$apollon_project_implementations.middleware.map(p =>
        import(path.join(process.cwd(), p))
      )
    )
  )
    .map(e => e.default)
    .concat(plugin_middlewares);

  const futurMiddleware = middlewareWrappers.map(wrapper => {
    if (!wrapper || !wrapper.call) {
      logger.error(
        "The middleware file must export a function returning the final express middleware"
      );
      process.exit(1);
    }
    const wrapperInfo = { priority: 0 };
    let middleware = wrapper.call(preContext, wrapperInfo);
    middleware.info = wrapperInfo;
    return middleware;
  });

  return (await Promise.all(futurMiddleware)).sort(
    (a, b) => a.wrapperHelpers.priority - b.wrapperHelpers.priority,
    0
  );
}

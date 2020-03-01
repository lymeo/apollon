export default async function(plugin_middlewares) {
  const middleware = await Promise.all(
    (
      await Promise.all(
        this.config.$apollon_project_implementations.middleware.map(p =>
          import(p)
        )
      )
    )
      .concat(plugin_middlewares)
      .map(e => ({ default: e }))
      .map(e => {
        const wrapperHelpers = { priority: 0 };
        const futurMiddleware = e.call(preContext, wrapperHelpers);
        futurMiddleware.wrapperHelpers = wrapperHelpers;
        return futurMiddleware;
      })
      .sort((a, b) => a.wrapperHelpers.priority - b.wrapperHelpers.priority, 0)
  );

  return middleware;
}

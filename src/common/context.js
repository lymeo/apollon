export default (preContext, injectors, subscriptions) =>
  async function({ req, res, connection }) {
    const context = Object.assign({}, preContext);

    if (connection) {
      //Define context for ws (subscriptions)
      context.connection = connection;

      if (subscriptions.context) {
        subscriptions.context.call(context, connection);
      }
    } else {
      //Define context for http (graphql)
      context.request = req;
      context.response = res;
    }
    await Promise.all(injectors.map(injector => injector(context)));

    return context;
  };

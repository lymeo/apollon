import apollo_server_express from "apollo-server-express";
const { withFilter } = apollo_server_express;

export default async function(resolvers) {
  const { PubSub } = this;

  function channel(name) {
    return {
      publish(data, metadata) {
        if (name && name != "") {
          PubSub.publish(
            name,
            Object.assign({}, metadata, {
              [name]: data
            })
          );
        }
      }
    };
  }

  function create(name, ...filters) {
    let subscribe = () => {
      return PubSub.asyncIterator(name);
    };
    if (filters) {
      subscribe = withFilter(subscribe, (payload, variables) => {
        return !filters.some(filter => !filter(payload, variables));
      });
    }
    resolvers.Subscription[name] = {
      subscribe
    };

    return channel(name);
  }

  return {
    channel,
    create
  };
}

import apollo_server_express from "apollo-server-express";
const { withFilter } = apollo_server_express;

export default function(schema, config, { pubsub }) {
  function channel(name) {
    return {
      publish(data, metadata) {
        if (name && name != "") {
          pubsub.publish(
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
      return pubsub.asyncIterator(name);
    };
    if (filters) {
      subscribe = withFilter(subscribe, (payload, variables) => {
        return !filters.some(filter => !filter(payload, variables));
      });
    }
    schema.Subscription[name] = {
      subscribe
    };

    return channel(name);
  }

  return {
    channel,
    create
  };
}

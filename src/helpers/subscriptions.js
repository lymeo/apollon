module.exports = function(schema) {
  return {
    create(name) {
      schema.Subscription[name] = {
        subscribe: (_, __, { pubsub }) => {
          return pubsub.asyncIterator(name);
        }
      };
    },
    channel(name, { pubsub }) {
      return {
        publish(data) {
          if (name && name != "") {
            pubsub.publish(name, {
              [name]: data
            });
          }
        }
      };
    }
  };
};

const subscriptions = require("./subscriptions");
const fs = require("./fs");

module.exports = function(schema, config) {
  return {
    subscriptions: subscriptions(schema, config),
    fs: fs(schema, config)
  };
};

import subscriptions from "./subscriptions.js";
import fs from "./fs.js";

export default function(schema, config) {
  return {
    subscriptions: subscriptions(schema, config),
    fs: fs(schema, config)
  };
};

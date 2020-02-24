import subscriptions from "./subscriptions.js";
import fs from "./fs.js";

export default function(schema, config, preContext) {
  return {
    subscriptions: subscriptions(schema, config, preContext),
    fs: fs(schema, config)
  };
}

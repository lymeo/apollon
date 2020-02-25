import apollo_server_express from "apollo-server-express";
const PubSubDefault = apollo_server_express.PubSub;

export default async function(config, subscriptionsPath) {
  let customSubscriptions = {};

  if (subscriptionsPath) {
    //Import customSubscriptions
    const customSubscriptionsFn = await import(subscriptionsPath);
    customSubscriptions = await customSubscriptionsFn.default(config);
  }

  const { PubSub, onConnect, onDisconnect, context } = customSubscriptions;

  this.pubsub = new (PubSub || PubSubDefault)();

  return { onConnect: onConnect, onDisconnect, context };
}

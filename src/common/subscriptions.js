import path from "path";

import apollo_server_express from "apollo-server-express";
const PubSubDefault = apollo_server_express.PubSub;

export default async function() {
  if (!this.config.$apollon_project_implementations.subscriptions) {
    this.PubSub = new PubSubDefault();
    return {};
  }
  const subscriptionsPath = path.join(
    process.cwd(),
    this.config.$apollon_project_implementations.subscriptions
  );

  let customSubscriptions = {};

  if (subscriptionsPath) {
    //Import customSubscriptions
    const customSubscriptionsFn = await import(subscriptionsPath);
    customSubscriptions = await customSubscriptionsFn.default.call(this);
  }

  const { PubSub, onConnect, onDisconnect, context } = customSubscriptions;

  try {
    this.PubSub = new (PubSub || PubSubDefault)();
  } catch (err) {
    this.logger.error(
      "Custum PubSubs have to be implementations (awaiting constructor) of PubSubEngine from https://www.apollographql.com/docs/apollo-server/data/subscriptions/#pubsub-implementations"
    );
    process.exit(-1);
  }

  return { onConnect: onConnect, onDisconnect, context };
}

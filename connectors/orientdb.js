var OrientDB = require("orientjs");
let entities = require("../dao/entities");

var server = OrientDB({
  host: "172.18.0.2",
  port: 2424,
  username: "root",
  password: "rootpwd"
});

module.exports = async function() {
  let classes = {};
  let db = server.use({
    name: "datavault_rgpd",
    username: "root",
    password: "rootpwd"
  });

  for (let entity of entities) {
    classes[entity.name] = await db.class.get(entity.name);
  }

  return {
    server,
    db,
    classes
  };
};

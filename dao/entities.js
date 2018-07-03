const requireDir = require("require-dir");

module.exports = function(db) {
  return requireDir("./entities", {
    mapValue: function(value, baseName) {
      return value(db);
    }
  });
};

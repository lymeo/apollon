const commentsDao = require("../dao/comments");

module.exports = function(schema) {
  let { Query, Mutation } = schema;

  // Type

  schema.Comment = {
    content: root => "> " + root.content
  };

  // Queries

  Query.getAll = async (root, _, { connectors: { local } }) => {
    return commentsDao(local).getAll();
  };
  Query.getById = async (root, { id }, { connectors: { local } }) => {
    return commentsDao(local).getById(id);
  };

  // Mutations

  Mutation.create = async (root, { data }, { connectors: { local } }) => {
    return commentsDao(local).create(data);
  };
  Mutation.delete = async (root, { id }, { connectors: { local } }) => {
    return commentsDao(local).delete(id);
  };
  Mutation.update = async (root, { id, data }, { connectors: { local } }) => {
    return commentsDao(local).update(id, data);
  };
};

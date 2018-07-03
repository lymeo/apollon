const entityDao = require("../dao/entities");

module.exports = function (schema) {
    let { Query, Mutation } = schema;

    // Type

    schema.Comment = {
        content: root => '> ' + root.content
    }

    // Queries

    Query.getAll = async (root, _, {local}) => {
        return entityDao(local).comments.getAll();
    }
    Query.getById = async (root, {id}, {local}) => {
        return entityDao(local).comments.getById(id);
    }

    // Mutations

    Mutation.create = async (root, {data}, {local}) => {
        return entityDao(local).comments.create(data);
    }
    Mutation.delete = async (root, {id}, {local}) => {
        return entityDao(local).comments.delete(id);
    }
    Mutation.update = async (root, {id, data}, {local}) => {
        return entityDao(local).comments.update(id, data);
    }
}
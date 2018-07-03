module.exports = function({db}){
    let dao = {
        getAll: async function () {
            return db.classes.comment.getAll();
        },
        getById: async function (id) {
            return db.classes.comment.getById(id);
        },
        create: async function (data) {
            return db.classes.comment.create(data);
        },
        delete: async function (id) {
            return db.classes.comment.delete(id);
        },
        update: async function (id, data) {
            return db.classes.comment.update(id, data);
        }
    }
    return dao;
}
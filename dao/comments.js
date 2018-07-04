
module.exports = function (db) {
  let dao = {
    getAll: async function () {
      return db.comments
    },
    getById: async function (id) {
      return db.comments.filter(comment => comment.id == id)[0]
    },
    create: async function (p_data) {
      let data = {
        id: new Date().getTime().toString(),
        content: p_data.content || "",
        author: p_data.author || "someone"
      };
      db.comments.push(data);
      return data;
    },
    delete: async function (id) {
      db.comments = db.comments.filter(
        comment => comment.id != id
      );
      return true;
    },

    update: async function (id, p_data) {
      db.comments.map(comment => {
        if (comment.id == id) {
          return Object.assign(comment, p_data);
        }
        return comment;
      });
      return true;
    }

  };
  return dao;
};
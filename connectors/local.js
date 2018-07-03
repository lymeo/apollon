var OrientDB = require("orientjs");

let comments = [
  {
    id: "0",
    content: "Hello world",
    author: "Louis Bertrand"
  },
  {
    id: "1",
    content: "Lymeo",
    author: "Cortney Knorr"
  },
  {
    id: "2",
    content: "brhibhribir",
    author: "vebiveivhei"
  }
];

module.exports = async function() {
  let classes = {
    comment: {
      idCounter: 3,
      comments,
      getAll: () => classes.comment.comments,
      getById: id => classes.comment.comments.filter(comment => comment.id == id)[0],
      delete: id => {
        classes.comment.comments = classes.comment.comments.filter(comment => comment.id != id);
        return true;
      },
      update: (id, p_data) => {
        classes.comment.comments.map(comment => {
          if (comment.id == id){
            return Object.assign(comment, p_data);
          } 
          return comment;
        })
        return true;
      },
      create: p_data => {
        let data = {
          id: classes.comment.idCounter.toString(),
          content: p_data.content || "",
          author: p_data.author || "someone"
        };
        classes.comment.idCounter += 1;
        classes.comment.comments.push(data);
        return data;
      }
    }
  };
  let db = {
    classes
  };

  return {
    db
  };
};

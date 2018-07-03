module.exports = function (db) {
    return {
        comments: require("./entities/comments")(db)
    }

}
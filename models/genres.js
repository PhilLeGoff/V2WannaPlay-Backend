const mongoose = require("mongoose");

const genreSchema = mongoose.Schema({
    name: String,
    liked: [{ type: mongoose.Schema.Types.ObjectId, ref: "users" }],
    played: [{ type: mongoose.Schema.Types.ObjectId, ref: "users" }]
});

const Genre = mongoose.model("genres", genreSchema);

module.exports = Genre;
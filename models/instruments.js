const mongoose = require("mongoose");

const instrumentSchema = mongoose.Schema({
    name: String,
    musicians: [{ type: mongoose.Schema.Types.ObjectId, ref: "users" }],
    teachers: [{ type: mongoose.Schema.Types.ObjectId, ref: "users" }]
});

const Instrument = mongoose.model("instruments", instrumentSchema);

module.exports = Instrument;
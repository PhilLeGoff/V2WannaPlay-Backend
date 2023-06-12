const mongoose = require("mongoose");

const userSchema = mongoose.Schema({
  username: String,
  email: String,
  firstname: String,
  lastname: String,
  birthday: { day: Number, month: String, year: Number },
  password: String,
  token: String,
  description: String,
  instrumentsPlayed: [String],
  instrumentsTaught: [String],
  genresLiked: [String],
  genresPlayed: [String],
  status: { online: Boolean, last_seen: Date },
  wannaplay: { active: Boolean, startTime: Date, endTime: Date },
  profilePicture: String,
  location: {
    type: {
      type: String,
      enum: ["Point"],
    },
    coordinates: {
      type: [Number],
    },
  },
  friends: {
    confirmed: [{ username: String }],
    requests: [{ username: String, refused: Boolean }],
    requested: [{ username: String }],
  },
  chats: [{ type: mongoose.Schema.Types.ObjectId, ref: "chats" }],
  private: Boolean,
});

userSchema.index({ location: "2dsphere" });

const User = mongoose.model("users", userSchema);

module.exports = User;

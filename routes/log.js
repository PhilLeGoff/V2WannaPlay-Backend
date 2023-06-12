var express = require("express");
var router = express.Router();
const User = require("../models/users");
const Instrument = require("../models/instruments");
const Genre = require("../models/genres");
require("../models/connection");
const uid2 = require("uid2");
const bcrypt = require("bcrypt");
const uniqid = require("uniqid");
const fs = require("fs");
const cloudinary = require("cloudinary").v2;

router.post("/signup", (req, res) => {
  const { username, email, password } = req.body;

  User.findOne({ username: username }).then((user) => {
    if (user) {
      res.json({ result: false, message: "Username already exists" });
    } else
      User.findOne({ email: email }).then((user) => {
        if (user) {
          res.json({ result: false, message: "Email already registered" });
        } else {
          const hash = bcrypt.hashSync(password, 10);
          const newUser = new User({
            username: username,
            password: hash,
            email: email,
            profilePicture:
              "https://res.cloudinary.com/dr2opzcia/image/upload/v1679595811/profilepic_kyzsdc.jpg",
            token: uid2(32),
          });

          newUser.save().then((user) => {
            res.json({
              result: true,
              token: user.token,
              username: user.username,
              profilePicture: user.profilePicture,
            });
          });
        }
      });
  });
});

const isTeacher = (elem, array) => {
  for (i = 0; i < array.length; i++) if (elem === array[i]) return true;
  return false;
};

router.post("/upload", async (req, res) => {
  const photoPath = `./tmp/${uniqid()}.jpg`;
  const resultMove = await req.files.image.mv(photoPath);
  const resultCloudinary = await cloudinary.uploader.upload(photoPath);

  fs.unlinkSync(photoPath);

  if (!resultMove) {
    res.json(resultCloudinary.secure_url);
  } else {
    res.json(null);
  }
});

router.post("/signupQuiz", (req, res) => {
  const {
    firstname,
    lastname,
    birthday,
    play,
    genres,
    description,
    token,
    profilePicture,
    private,
  } = req.body;
  let userData;
  let userInfo;

  User.findOneAndUpdate(
    { token: token },
    {
      firstname: firstname,
      lastname: lastname,
      birthday: birthday,
      instrumentsPlayed: play.instruments,
      instrumentsTaught: play.teach,
      genresLiked: genres.liked,
      genresPlayed: genres.played,
      description: description,
      location: null,
      status: { online: true, last_seen: null },
      friends: { confirmed: [], requests: [], requested: [], refused: [] },
      wannaplay: { active: false, startTime: null, endTime: null },
      profilePicture: profilePicture,
      private: private,
    },
    { new: true }
  )
    .then((data) => {
      userData = data;
      userInfo = {token: data.token, username: data.username, profilePicture: data.profilePicture, logged: true}
      const updateMusiciansPromises = play.instruments.map((instrument) => {
        return Instrument.findOneAndUpdate(
          { name: instrument },
          { $addToSet: { musicians: data._id } },
          { upsert: true } // create a new instrument if it doesn't exist
        );
      });

      // Wait for all update musician promises to resolve
      return Promise.all(updateMusiciansPromises);
    })
    .then(() => {
      // Once all musicians have been updated, map over instruments to update teachers
      const updateTeachersPromises = play.teach.map((instrument) => {
        return Instrument.findOneAndUpdate(
          { name: instrument },
          { $addToSet: { teachers: userData._id } },
          { upsert: true }
        );
      });

      // Wait for all update teacher promises to resolve
      return Promise.all(updateTeachersPromises);
    })
    .then(() => {
      const updateLikedPromises = genres.liked.map((genre) => {
        return Genre.findOneAndUpdate(
          { name: genre },
          { $addToSet: { liked: userData._id } },
          { upsert: true }
        );
      });
      return Promise.all(updateLikedPromises);
    })
    .then(() => {
      const updatePlayedPromises = genres.played.map((genre) => {
        return Genre.findOneAndUpdate(
          { name: genre },
          { $addToSet: { played: userData._id } },
          { upsert: true }
        );
      });
      return Promise.all(updatePlayedPromises);
    })
    .then(() => res.json({ result: true, userData: userInfo }));
});

router.post("/signin", (req, res) => {
  const { input, password } = req.body;

  User.findOne({ $or: [{ username: input }, { email: input }] }).then(
    (user) => {
      if (!user) res.json({ result: false });
      else {
        if (bcrypt.compareSync(password, user.password))
          res.json({
            result: true,
            token: user.token,
            username: user.username,
            profilePicture: user.profilePicture
          });
        else res.json({ result: false });
      }
    }
  );
});

router.post("/signout", (req, res) => {
  const { token, now } = req.body;

  User.findOneAndUpdate(
    { token: token },
    { status: { online: false, last_seen: now } }
  ).then((user) => {
    res.json({ result: true });
  });
});

router.post;

module.exports = router;

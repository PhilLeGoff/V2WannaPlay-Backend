var express = require("express");
var router = express.Router();
const User = require("../models/users");

require("../models/connection");

/* GET users listing. */
router.get("/", function (req, res, next) {
  res.send("respond with a resource");
});

router.get("/profile/:friendname/", (req, res) => {
  User.findOne({ username: req.params.friendname }).then((data) => {
    res.json({
      result: true,
      userData: {
        instrumentsPlayed: data.instrumentsPlayed,
        instrumentsTaught: data.instrumentsTaught,
        genresLiked: data.genresLiked,
        genresPlayed: data.genresPlayed,
        description: data.description,
        profilePicture: data.profilePicture,
      },
    });
  });
});

router.get("/info/:token", (req, res) => {
  const token = req.params.token;

  User.findOne({ token: token }).then((userData) => {
    res.json({
      firstname: userData.firstname,
      lastname: userData.lastname,
      profilePicture: userData.profilePicture,
      private: userData.private,
      birthday: userData.birthday,
      description: userData.description,
      instrumentsPlayed: userData.instrumentsPlayed,
      instrumentsTaught: userData.instrumentsTaught,
      genresLiked: userData.genresLiked,
      genresPlayed: userData.genresPlayed,
    });
  });
});

router.get("/location/:token", (req, res) => {
  const token = req.params.token;

  User.findOne({ token: token }).then((userData) => {
    res.json({ result: true, location: userData.location });
  });
});

router.get("/allLocations/:lat/:lon", (req, res) => {
  const { lon, lat } = req.params;


  User.find({
    location: {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: [lat, lon],
        },
        $maxDistance: 10000, // 10 kilometers
      },
    },
  }).then((foundUsers) => {
    if (foundUsers) {
      const filteredUsers = foundUsers
        .filter((user) => user.private === false)
        .map((user) => ({
          location: user.location,
          username: user.username,
          profilePicture: user.profilePicture,
          status: user.status,
        }));
      res.json({ result: true, foundUsers: filteredUsers });
    } else res.json({ result: false, foundUsers: [] });
  });
});

router.put("/location", (req, res) => {
  const { token, coordinates } = req.body;

  User.findOneAndUpdate(
    { token: token },
    { location: { type: "Point", coordinates: coordinates } }
  ).then(() => res.json({ result: true }));
});

module.exports = router;

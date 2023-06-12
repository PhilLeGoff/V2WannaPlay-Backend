var express = require("express");
var router = express.Router();
const User = require("../models/users");
const Genre = require("../models/genres");
const Instrument = require("../models/instruments");
require("../models/connection");

function orderBySequencePosition(foundUsers, sequence) {
  let result = [];
  for (let i = 0; i < foundUsers.length; i++) {
    let user = foundUsers[i];
    if (containsSequence(user.username, sequence)) {
      let index = user.username.indexOf(sequence);
      result.push({
        username: user.username,
        status: user.status,
        wannaplay: user.wannaplay,
        profilePicture: user.profilePicture,
        index: index,
      });
    }
  }
  result.sort((a, b) => a.index - b.index);
  return result.map((item) => ({
    username: item.username,
    status: item.status,
    wannaplay: item.wannaplay,
    profilePicture: item.profilePicture,
  }));
}

function containsSequence(str, sequence) {
  return str.includes(sequence);
}

router.post("/users", (req, res) => {
  const { search, option } = req.body;
  const foundUsers = [];


  switch (option) {
    case "username":
      User.find()
        .then((users) => {
          users.map((user) => {
            if (containsSequence(user.username, search))
              foundUsers.push({
                username: user.username,
                status: user.status,
                wannaplay: user.wannaplay,
                profilePicture: user.profilePicture,
              });
          });
        })
        .then(() => {
          res.json({
            result: true,
            foundUsers: orderBySequencePosition(foundUsers, search),
          });
        });
      break;
    case "instrument played":
      Instrument.findOne({ name: search })
        .populate("musicians")
        .then((data) => {
          data.musicians.map((musician) =>
            foundUsers.push({
              username: musician.username,
              status: musician.status,
              wannaplay: musician.wannplay,
              profilePicture: musician.profilePicture,
            })
          );
        })
        .then(() => res.json({ result: true, foundUsers: foundUsers }));
      break;
    case "instrument taught":
      Instrument.findOne({ name: search })
        .populate("teachers")
        .then((data) => {
          data.teachers.map((musician) =>
            foundUsers.push({
              username: musician.username,
              status: musician.status,
              wannaplay: musician.wannplay,
              profilePicture: musician.profilePicture,
            })
          );
        })
        .then(() => res.json({ result: true, foundUsers: foundUsers }));
      break;
    case "genres played":
      Genre.findOne({ name: search })
        .populate("played")
        .then((data) => {
          data.played.map((play) => {
            foundUsers.push({
              username: play.username,
              status: play.status,
              wannaplay: play.wannplay,
              profilePicture: play.profilePicture,
            });
          });
        })
        .then(() => res.json({ result: true, foundUsers: foundUsers }));
      break;
    case "genres liked":
      Genre.findOne({ name: search })
        .populate("liked")
        .then((data) => {
          data.liked.map((like) => {
            foundUsers.push({
              username: like.username,
              status: like.status,
              wannaplay: like.wannplay,
              profilePicture: like.profilePicture,
            });
          });
        })
        .then(() => res.json({ result: true, foundUsers: foundUsers }));
      break;
  }
});

module.exports = router;

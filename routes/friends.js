var express = require("express");
var router = express.Router();
const User = require("../models/users");
const Instrument = require("../models/instruments");
const Genre = require("../models/genres");
require("../models/connection");

router.get("/friend/:token/:friendUsername", (req, res) => {
  const { token, friendUsername } = req.params;

  User.findOne({ token: token }).then((userData) => {
    if (
      userData.friends.requests.find(
        (request) => request.username === friendUsername
      )
    )
      res.json({ friendStatus: "requested" });
    else if (
      userData.friends.confirmed.find(
        (friend) => friend.username === friendUsername
      )
    )
      res.json({ friendStatus: "friend" });
    else if (
      userData.friends.requested.find(
        (request) => request.username === friendUsername
      )
    )
      res.json({ friendStatus: "asked" });
    else res.json({ friendStatus: "not friends" });
  });
});

router.post("/friend", async (req, res) => {
  const { token, friendUsername } = req.body;

  const userData = await User.findOneAndUpdate(
    {
      token: token,
    },
    { $push: { "friends.requested": { username: friendUsername } } }
  );

  const friendData = await User.findOneAndUpdate(
    { username: friendUsername },
    {
      $push: {
        "friends.requests": { username: userData.username, refused: false },
      },
    }
  );

  res.json({ result: true });
});

router.put("/friend", async (req, res) => {
  const { token, friendUsername } = req.body;

  const userData = await User.findOneAndUpdate(
    {
      token: token,
      //   "friends.requested.username": friendUsername,
    },
    {
      $pull: { "friends.requests": { username: friendUsername } },
      $push: { "friends.confirmed": { username: friendUsername } },
    },
    { new: true }
  );

  const friendData = await User.findOneAndUpdate(
    {
      username: friendUsername,
      //   "friends.requests.username": userData.username,
    },
    {
      $pull: { "friends.requested": { username: userData.username } },
      $push: { "friends.confirmed": { username: userData.username } },
    },
    { new: true }
  );


  res.status(200).send("Friend request accepted.");
});

router.delete("/friend", async (req, res) => {
  const { token, friendUsername } = req.body;

  const userData = await User.findOneAndUpdate(
    { token: token },
    { $pull: { "friends.confirmed": { username: friendUsername } } }
  );

  await User.findOneAndUpdate(
    { username: friendUsername },
    { $pull: { "friends.confirmed": { username: userData.username } } }
  );
});

router.get("/requests/:token", async (req, res) => {
  const token = req.params.token;

  const foundUser = await User.findOne({ token: token });

  const foundUsers = await Promise.all(
    foundUser.friends.requests
      .filter((request) => !request.refused)
      .map(async (request) => {
        const userData = await User.findOne({ username: request.username });
        return {
          username: userData.username,
          status: userData.status,
          wannaplay: userData.wannaplay,
          profilePicture: userData.profilePicture,
        };
      })
  );

  res.json({ result: true, foundUsers: foundUsers });
});

router.get("/confirmed/:token", async (req, res) => {
  const token = req.params.token;

  const friends = await User.findOne({ token: token }).then((userData) => {
    return userData.friends.confirmed;
  });

  const foundUsers = await Promise.all(
    friends.map(async (friend) => {
      const userData = User.findOne({ username: friend.username }).then(
        (data) => {
          return { username: data.username, status: data.status, wannaplay: data.wannaplay,
            profilePicture: data.profilePicture, };
        }
      );
      return userData;
    })
  );


  res.json({ foundUsers: foundUsers });
});

module.exports = router;

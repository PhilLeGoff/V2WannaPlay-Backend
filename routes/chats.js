var express = require("express");
var router = express.Router();
const Chat = require("../models/chats");
const User = require("../models/users");

require("../models/connection");

const Pusher = require("pusher");
const pusher = new Pusher({
  appId: process.env.PUSHER_APPID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.PUSHER_CLUSTER,
  useTLS: true,
});

const checkToken = (token) => {
  return User.findOne({ token: token }).then((data) =>
    data ? data.username : false
  );
};

const createChatName = (chatMates) => {
  if (chatMates.length === 1) {
    return chatMates[0];
  } else if (chatMates.length === 2) {
    return `${chatMates[0]}${chatMates[1]}`;
  } else {
    const lastMate = chatMates.pop();
    const firstMates = chatMates.join(",");
    return `${firstMates}and${lastMate}`;
  }
};

const createChat = async (chatMates) => {
  try {
    // Check if there is a chat containing all the chatMates
    const chat = await Chat.findOne({ users: { $all: chatMates } });

    if (chat) {
      return chat;
    } else {
      const newChat = new Chat({
        chatName: createChatName(chatMates),
        users: chatMates,
        messages: [],
      });

      await newChat.save();

      const promises = chatMates.map(async (mate) => {
        const user = await User.findOne({ username: mate });
        user.chats.push(newChat._id);
        return user.save();
      });

      await Promise.all(promises);

      return newChat;
    }
  } catch (error) {
    console.error(error);
    res.json({ result: false, error: "Server error" });
  }
};

const orderByLastMessageDate = (chats) => {
  return chats.sort((a, b) => {
    const aLastMessage = a.messages.length
      ? a.messages[a.messages.length - 1].createdAt
      : 0;
    const bLastMessage = b.messages.length
      ? b.messages[b.messages.length - 1].createdAt
      : 0;
    return bLastMessage - aLastMessage;
  });
};

router.get("/:token", async (req, res) => {
  const userData = await User.findOne({ token: req.params.token }).populate(
    "chats"
  );
  const chatsOrdered = orderByLastMessageDate(userData.chats);

  // chatsOrdered.map((chat) => {});
  res.json({ result: true, chats: chatsOrdered });
});

router.post("/join", async (req, res) => {
  const { token, chatMates } = req.body;

  const username = await checkToken(token);

  if (!username) {
    res.json({ result: false, error: "Access denied" });
    return;
  }

  const chat = await createChat(chatMates);

  pusher.trigger(chat.chatName, "join", {
    username: username,
  });


  res.json({ result: true, chatData: chat });
});

router.post("/leave", (req, res) => {
  const { chatName, username } = req.body;
  pusher.trigger(chatName, "leave", {
    username: username,
  });
  res.json({ result: true });
});

router.post("/message", (req, res) => {
  const { chatName, payload } = req.body;
  pusher.trigger(chatName, "message", payload);
  Chat.findOneAndUpdate(
    { chatName: chatName },
    { $push: { messages: payload } }
  ).then(() => res.json({ result: true }));
});

module.exports = router;

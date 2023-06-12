require("dotenv").config();

var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
const fileUpload = require("express-fileupload");

var indexRouter = require("./routes/index");
var usersRouter = require("./routes/users");
var logRouter = require("./routes/log");
var searchRouter = require("./routes/search");
var friendsRouter = require("./routes/friends");
var chatsRouter = require("./routes/chats");

var app = express();

const cors = require("cors");
app.use(cors());

app.use(fileUpload());
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/", indexRouter);
app.use("/users", usersRouter);
app.use("/log", logRouter);
app.use("/search", searchRouter);
app.use("/friends", friendsRouter);
app.use("/chats", chatsRouter);

module.exports = app;

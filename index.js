const express = require("express");
const socketio = require("socket.io");
const http = require("http");
const cors = require("cors");

//geting function from users.js
const { addUser, removeUser, getUser, getUsersInRoom } = require("./users.js");

const PORT = process.env.PORT || 5000;

const router = require("./router");

const app = express();
const server = http.createServer(app);
const io = socketio(server);

app.use(router);
app.use(cors());
//router for chat
// connection for chat
io.on("connection", (socket) => {
  //console.log("we have a new connection!");
  //making the use of signned up user
  socket.on("join", ({ name, room }, callback) => {
    const { error, user } = addUser({ id: socket.id, name, room });
    if (error) return callback(error);

    //admin generated message
    socket.emit("message", {
      user: "admin",
      text: `${user.name}, welcome to interaction at ${user.room}`,
    });
    //message to all rooms
    socket.broadcast
      .to(user.room)
      .emit("message", { user: "admin", text: `${user.name}, has joined!` });

    socket.join(user.room);
    io.to(user.room).emit("roomData", {
      room: user.room,
      users: getUsersInRoom(user.room),
    });
    callback();
  });

  //user generated messages
  socket.on("sendMessage", (message, callback) => {
    const user = getUser(socket.id);
    io.to(user.room).emit("message", { user: user.name, text: message });
    io.to(user.room).emit("roomData", {
      room: user.room,
      users: getUsersInRoom(user.room),
    });
    callback();
  });
  socket.on("disconnect", () => {
    // console.log("user has been left!");
    const user = removeUser(socket.id);

    if (user) {
      io.to(user.room).emit("message", {
        user: "jokers",
        text: `${user.name} has left.`,
      });
    }
  });
});

server.listen(PORT, () => {
  console.log(`server has is running on port ${PORT}`);
});

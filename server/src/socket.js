const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const User = require("./models/User");
const Message = require("./models/Message");

/**
 * Attaches a Socket.IO server to the given HTTP server.
 * Auth: token must be passed as socket.handshake.auth.token (JWT). Unauthenticated
 * sockets are disconnected before the connection event fires.
 * Rooms: each socket joins a room named by its userId, enabling targeted delivery.
 * Echo: new_message is emitted to both recipient and sender rooms so the sender's
 * other devices receive the message too — clients must deduplicate by _id.
 */
function initSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: { origin: "*" },
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("No token"));
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(payload.id).select("_id username displayName avatar");
      if (!user) return next(new Error("User not found"));
      socket.user = user;
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    // Each socket joins a room named by its own userId so targeted delivery works
    socket.join(socket.user._id.toString());

    socket.on("send_message", async ({ to, content }) => {
      if (!to || !content?.trim()) return;
      try {
        const msg = await Message.create({ from: socket.user._id, to, content: content.trim() });
        const populated = await msg.populate([
          { path: "from", select: "username displayName avatar" },
          { path: "to",   select: "username displayName avatar" },
        ]);
        // Deliver to recipient's room (and echo back to sender's room for multi-device)
        io.to(to).emit("new_message", populated);
        io.to(socket.user._id.toString()).emit("new_message", populated);
      } catch (err) {
        socket.emit("error", { message: "Failed to send message" });
      }
    });
  });

  return io;
}

module.exports = { initSocket };

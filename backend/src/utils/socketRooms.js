const jwt = require("jsonwebtoken");
const User = require("../models/User");

function roomForUser(userId) {
  return `user:${String(userId)}`;
}

async function resolveSocketUser(socket) {
  const authHeader = socket.handshake.auth?.token || socket.handshake.headers?.authorization;
  if (!authHeader) return null;

  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : authHeader;
  if (!token || !process.env.JWT_SECRET) return null;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("_id active");
    if (!user || user.active === false) return null;
    return user;
  } catch {
    return null;
  }
}

function emitToUser(io, userId, event, payload) {
  if (!io || !userId) return;
  io.to(roomForUser(userId)).emit(event, payload);
}

module.exports = {
  emitToUser,
  resolveSocketUser,
  roomForUser,
};

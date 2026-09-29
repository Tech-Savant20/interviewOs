import { verfiyToken } from "../utils/jwt.js";
import cookie from "cookie";

export const chatSocket = (io) => {
  io.use((socket, next) => {
    try {
      const cookies = socket.handshake.headers.cookie;
      if (!cookies) return next(new Error("No cookies"));

      const parsed = cookie.parse(cookies);
      const token = parsed.token;
      if (!token) return next(new Error("No token"));

      const decoded = verfiyToken(token);
      socket.userId = String(decoded.id);

      next();
    } catch (err) {
      next(new Error("Authentication failed"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.userId;

    console.log("✅ Connected:", userId);

    socket.join(userId);

    socket.on("send_message", ({ receiverId, text }) => {
      if (!receiverId || !text?.trim()) return;

      const payload = {
        senderId: userId,
        receiverId: String(receiverId),
        text: text.trim(),
        timestamp: new Date().toISOString(),
      };

      io.to(String(receiverId)).emit("receive_message", payload);
      socket.emit("receive_message", payload);
    });
    socket.on("join-room", (roomId) => {
    socket.join(roomId);
    });

     socket.on("code-change", ({ roomId, code }) => {

    socket.to(roomId).emit("code-update", code);

     });

    socket.on("language-change", ({ roomId, language, code }) => {
      if (!roomId || !language) return;
      socket.to(roomId).emit("language-update", { language, code });
    });

    socket.on("code-output", ({ roomId, output }) => {
      if (!roomId || typeof output !== "string") return;
      socket.to(roomId).emit("code-output", output);
    });
    socket.on("join_video_room", ({ roomId }) => {
      if (!roomId) return;

      socket.join(roomId);

      socket.to(roomId).emit("user_joined_video", {
        userId,
        socketId: socket.id,
      });
    });

    socket.on("video_offer", ({ roomId, offer }) => {
      if (!roomId || !offer) return;

      socket.to(roomId).emit("video_offer", {
        offer,
        fromUserId: userId,
        fromSocketId: socket.id,
      });
    });

    socket.on("video_answer", ({ roomId, answer }) => {
      if (!roomId || !answer) return;

      socket.to(roomId).emit("video_answer", {
        answer,
        fromUserId: userId,
        fromSocketId: socket.id,
      });
    });

    socket.on("ice_candidate", ({ roomId, candidate }) => {
      if (!roomId || !candidate) return;

      socket.to(roomId).emit("ice_candidate", {
        candidate,
        fromUserId: userId,
        fromSocketId: socket.id,
      });
    });

    socket.on("leave_video_room", ({ roomId }) => {
      if (!roomId) return;

      socket.leave(roomId);

      socket.to(roomId).emit("user_left_video", {
        userId,
        socketId: socket.id,
      });
    });

    socket.on("disconnect", () => {
      console.log("❌ Disconnected:", userId);
    });
  });
};
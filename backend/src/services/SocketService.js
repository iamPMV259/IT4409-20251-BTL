// src/services/SocketService.js
let io = null;

module.exports = {
  // Hàm khởi tạo được gọi bên app.js
  init: (httpServer) => {
    const { Server } = require("socket.io");
    io = new Server(httpServer, {
      cors: {
        origin: "*", // Cấu hình lại domain FE của bạn cho bảo mật sau này
        methods: ["GET", "POST", "PATCH", "DELETE"]
      }
    });

    io.on("connection", (socket) => {
      console.log("🟢 User connected to socket:", socket.id);

      // User join vào room của Project cụ thể
      socket.on("join_project", (projectId) => {
        socket.join(projectId);
        console.log(`User ${socket.id} joined project room: ${projectId}`);
      });
      
      // User rời project
      socket.on("leave_project", (projectId) => {
        socket.leave(projectId);
      });

      socket.on("disconnect", () => {
        console.log("🔴 User disconnected:", socket.id);
      });
    });

    return io;
  },

  // Hàm lấy instance để dùng trong Controller
  getIO: () => {
    if (!io) {
      throw new Error("Socket.io not initialized!");
    }
    return io;
  }
};
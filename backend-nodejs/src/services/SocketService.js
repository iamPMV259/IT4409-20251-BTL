// src/services/SocketService.js
let io = null;

module.exports = {
  init: (httpServer) => {
    const { Server } = require("socket.io");
    io = new Server(httpServer, {
      cors: {
        origin: "*", 
        methods: ["GET", "POST", "PATCH", "DELETE"]
      }
    });

    io.on("connection", (socket) => {
      console.log("User connected to socket:", socket.id);

      socket.on("join_project", (projectId) => {
        socket.join(projectId);
        console.log(`User ${socket.id} joined project room: ${projectId}`);
      });
      
      socket.on("leave_project", (projectId) => {
        socket.leave(projectId);
      });

      socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
      });
    });

    return io;
  },

  getIO: () => {
    if (!io) {
      throw new Error("Socket.io not initialized!");
    }
    return io;
  }
};
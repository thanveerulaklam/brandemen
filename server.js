const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

// Enable CORS for all origins
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Store connected users
const users = new Map();
const rooms = {
  'venting': new Set(),
  'advice': new Set(),
  'struggles': new Set(),
  'success': new Set(),
  'questions': new Set(),
  'health': new Set(),
  'finance': new Set()
};

io.on('connection', (socket) => {
  console.log('✅ New user connected:', socket.id);

  // User joins
  socket.on('user-join', (data) => {
    const { userId, username, room } = data;
    
    users.set(socket.id, { userId, username, room });
    if (rooms[room]) {
      rooms[room].add(socket.id);
    }

    // Notify others in the room
    socket.to(room).emit('user-joined', { username });
    
    // Send current user count for the room
    io.to(socket.id).emit('user-count', { 
      room, 
      count: rooms[room] ? rooms[room].size : 0 
    });

    console.log(`📥 ${username} joined room: ${room}`);
  });

  // Join a room
  socket.on('join-room', (room) => {
    socket.join(room);
    
    // Update user's room
    const user = users.get(socket.id);
    if (user) {
      // Remove from old room
      if (rooms[user.room]) {
        rooms[user.room].delete(socket.id);
      }
      // Add to new room
      user.room = room;
      if (rooms[room]) {
        rooms[room].add(socket.id);
      }
    }

    // Send updated count
    io.to(socket.id).emit('user-count', { 
      room, 
      count: rooms[room] ? rooms[room].size : 0 
    });

    console.log(`🔄 ${socket.id} joined room: ${room}`);
  });

  // Leave a room
  socket.on('leave-room', (room) => {
    socket.leave(room);
    
    if (rooms[room]) {
      rooms[room].delete(socket.id);
    }
  });

  // Handle messages
  socket.on('chat-message', (data) => {
    const user = users.get(socket.id);
    
    if (user) {
      const messageData = {
        ...data,
        userId: user.userId,
        username: user.username,
        timestamp: Date.now()
      };

      // Broadcast to everyone in the room
      io.to(data.room).emit('chat-message', messageData);
      
      console.log(`💬 Message in ${data.room} from ${user.username}`);
    }
  });

  // Typing indicator
  socket.on('typing', (data) => {
    const user = users.get(socket.id);
    if (user) {
      socket.to(data.room).emit('typing', {
        username: user.username,
        isTyping: data.isTyping
      });
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    const user = users.get(socket.id);
    
    if (user) {
      console.log(`👋 ${user.username} disconnected`);
      
      // Remove from room
      if (rooms[user.room]) {
        rooms[user.room].delete(socket.id);
      }
      
      // Notify others in room
      socket.to(user.room).emit('user-left', { username: user.username });
      
      users.delete(socket.id);
    }

    console.log('❌ User disconnected:', socket.id);
  });

  // Heartbeat/ping
  socket.on('ping', () => {
    socket.emit('pong');
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`🚀 Brandemen WebSocket server running on port ${PORT}`);
  console.log(`📍 Server ready for connections`);
});

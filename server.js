// server.js - Deploy to Render.com (FREE FOREVER)
const WebSocket = require('ws');
const http = require('http');
const express = require('express');
const path = require('path');

const app = express();
const server = http.createServer(app);

// Serve static files from current directory
app.use(express.static(path.join(__dirname)));

// Create WebSocket server
const wss = new WebSocket.Server({ server });

// Store connected clients
const clients = new Map();
const rooms = {
  'venting': new Set(),
  'advice': new Set(),
  'struggles': new Set(),
  'success': new Set(),
  'questions': new Set(),
  'health': new Set(),
  'finance': new Set()
};

function generateId() {
  return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function broadcastToRoom(roomId, message) {
  const room = rooms[roomId];
  if (room) {
    room.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
      }
    });
  }
}

function getRoomUserCount(roomId) {
  const room = rooms[roomId];
  return room ? room.size : 0;
}

wss.on('connection', (ws) => {
  const userId = generateId();
  const userInfo = {
    userId,
    username: `User${Math.floor(Math.random() * 1000)}`,
    room: 'venting',
    ws: ws
  };
  
  clients.set(ws, userInfo);
  
  console.log('✅ User connected:', userId, 'Total:', clients.size);
  
  // Send welcome message
  ws.send(JSON.stringify({
    type: 'welcome',
    userId: userId,
    message: 'Connected to Brandemen community'
  }));

  // Join default room
  if (!rooms[userInfo.room]) {
    rooms[userInfo.room] = new Set();
  }
  rooms[userInfo.room].add(ws);

  // Notify others in room
  broadcastToRoom(userInfo.room, {
    type: 'user-joined',
    userId: userId,
    username: userInfo.username,
    room: userInfo.room,
    onlineCount: getRoomUserCount(userInfo.room)
  });

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data);
      const client = clients.get(ws);
      
      if (message.type === 'join-room') {
        // Leave previous room
        if (client.room && rooms.has(client.room)) {
          rooms.get(client.room).delete(ws);
        }
        
        // Join new room
        client.room = message.room;
        client.username = message.username || client.username;
        
        if (!rooms.has(message.room)) {
          rooms.set(message.room, new Set());
        }
        rooms.get(message.room).add(ws);
        
        // Notify room
        broadcastToRoom(message.room, {
          type: 'user-joined',
          userId: client.userId,
          username: client.username,
          room: message.room,
          onlineCount: getRoomUserCount(message.room)
        });
        
        // Send updated count to client
        ws.send(JSON.stringify({
          type: 'user-count',
          room: message.room,
          count: getRoomUserCount(message.room)
        }));
      }
      
      if (message.type === 'chat-message') {
        broadcastToRoom(client.room, {
          type: 'chat-message',
          userId: client.userId,
          username: client.username,
          text: message.text,
          room: client.room,
          timestamp: Date.now()
        });
      }
      
    } catch (error) {
      console.error('Message error:', error);
    }
  });

  ws.on('close', () => {
    const client = clients.get(ws);
    if (client) {
      // Notify room
      if (client.room && rooms.has(client.room)) {
        broadcastToRoom(client.room, {
          type: 'user-left',
          userId: client.userId,
          username: client.username,
          room: client.room,
          onlineCount: getRoomUserCount(client.room) - 1
        });
        
        // Clean up
        rooms.get(client.room).delete(ws);
      }
      clients.delete(ws);
    }
    
    console.log('❌ User disconnected. Total:', clients.size);
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    users: clients.size,
    rooms: Array.from(Object.keys(rooms)),
    timestamp: new Date().toISOString()
  });
});

app.get('/', (req, res) => {
  res.json({ 
    message: 'Brandemen WebSocket Server',
    status: 'running'
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Brandemen WebSocket server running on port ${PORT}`);
  console.log(`📍 Server ready for connections`);
});

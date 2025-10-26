# Brandemen - Premium Zero-Cost Men's Support Web App

A visually stunning, premium-feeling anonymous men's support chat platform built with pure client-side technologies. Zero backend costs, zero databases, 100% privacy-focused.

## 🌟 Features

### Premium Visual Design
- Luxury men's wellness aesthetic inspired by Calm and Headspace
- Sophisticated color palette with glass morphism effects
- Smooth animations and micro-interactions
- Premium typography (Inter + Playfair Display)
- Mobile-first responsive design

### Core Features
- **Anonymous User System**: Auto-generated premium usernames (e.g., "ResilientOak", "WiseAnchor")
- **Support Rooms**: 7 specialized spaces for different needs (Venting, Advice, Struggles, Success, Q&A, Health, Finance)
- **Multi-Tab Messaging**: Real-time communication across browser tabs/windows
- **Safety & Moderation**: Content filtering and community guidelines
- **Keyboard Shortcuts**: Enter to send, efficient navigation

### Zero-Cost Architecture
- Single HTML file with separate CSS and JS
- Pure client-side P2P WebRTC (no backend servers)
- Host on Vercel free tier
- No databases or data persistence
- Ephemeral messages - vanish when users leave

## 🚀 Getting Started

### Local Development

1. Clone the repository:
```bash
git clone <repository-url>
cd brandemen
```

2. Open `index.html` in your browser:
```bash
open index.html
```

Or use a local server:
```bash
python3 -m http.server 8000
# Then visit http://localhost:8000
```

### Deployment to Vercel

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Deploy:
```bash
vercel
```

3. Follow the prompts and your app will be live at `https://your-app.vercel.app`

## 📁 Project Structure

```
brandemen/
├── index.html          # Main HTML structure
├── styles.css          # Premium CSS design system
├── app.js             # Application logic & P2P WebRTC
├── vercel.json        # Vercel deployment config
└── README.md          # This file
```

## 🎨 Design System

### Color Palette
- **Primary**: `#1e3a8a` (Deep Navy)
- **Secondary**: `#065f46` (Forest Green)
- **Accent**: `#d97706` (Warm Gold)
- **Background**: `#0f172a` (Dark Navy)
- **Surface**: `rgba(255,255,255,0.1)` (Glass effect)

### Typography
- **Headers**: Playfair Display (serif)
- **Body**: Inter (sans-serif)

### Animation Philosophy
- Cubic-bezier transitions for premium feel
- Fade-in-up message animations
- Pulsating connection indicators
- Smooth room transitions

## 🛠️ Technical Implementation

### P2P WebRTC Architecture
- Uses WebRTC Data Channels for messaging
- STUN servers for NAT traversal
- Peer-to-peer connection management
- No signaling server required for basic functionality

### State Management
- Vanilla JavaScript with Map/Set data structures
- Session-based identity
- Room-based message filtering

### Safety Systems
- Pattern-based content filtering
- Length validation
- Community guidelines overlay
- Report functionality (UI ready)

## 🎯 Support Rooms

1. **🌀 Venting Space** - Release pressure and emotions
2. **💡 Bro Advice** - Practical wisdom and guidance
3. **🛟 Daily Struggles** - Everyday challenges
4. **🎉 Success Stories** - Celebrate wins together
5. **❓ Q&A** - Seek and share guidance

## 🔒 Privacy & Safety

- **No User Accounts**: Completely anonymous
- **Session-Based**: Identity resets on refresh
- **No Data Storage**: Messages are ephemeral
- **Client-Side Only**: No server-side logging
- **Content Moderation**: Real-time pattern filtering
- **Community Guidelines**: Built-in safety protocols

## 🚧 Current Limitations

This is a **client-side only prototype** with the following limitations:

1. **Tab-Only Communication**: BroadcastChannel only works within the same browser (across tabs/windows), NOT across different browsers or devices
2. **No Persistence**: All messages are lost on refresh
3. **No Cross-Device**: Users on different devices won't see each other's messages

### Why?
BroadcastChannel is a browser API that allows same-origin communication between tabs. It's perfect for testing and demos, but limited to a single browser instance.

### To Enable Cross-Device Messaging:
You would need a WebSocket server:
- Node.js + Socket.io backend
- Message broadcasting to all connected clients
- Real-time synchronization across all devices

## 🔮 Future Enhancements

- [ ] Full WebRTC signaling implementation
- [ ] Peer discovery and connection management
- [ ] Message reactions and interactions
- [ ] Advanced moderation tools
- [ ] Offline mode with local storage
- [ ] Push notifications (via service workers)
- [ ] Message encryption
- [ ] File sharing capabilities

## 📱 Browser Support

- Chrome/Edge (recommended)
- Firefox
- Safari
- Mobile browsers (iOS/Android)

## 🤝 Contributing

This is a demonstration project. For improvements:
1. Fork the repository
2. Create a feature branch
3. Submit a pull request

## 📄 License

MIT License - feel free to use this for your own projects.

## 🙏 Acknowledgments

- Inspired by Calm, Headspace, and Clubhouse
- Built with modern web technologies
- Design philosophy: Premium feel with zero cost

---

**Built with ❤️ for men's mental health and wellbeing**

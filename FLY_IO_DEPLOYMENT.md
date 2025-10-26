# 🚀 Fly.io Deployment Guide - FREE FOREVER

## Why Fly.io is Better:

✅ **No spin-down** - Always running, no cold starts  
✅ **Global edge network** - Faster for users worldwide  
✅ **3 VMs free forever** - Enough for most apps  
✅ **Auto HTTPS & SSL** - No configuration needed  
✅ **Better WebSocket support** - More reliable connections  
✅ **Easy scaling** - Add instances with one command  

---

## 📋 Step 1: Install Fly CLI

### Mac:
```bash
curl -L https://fly.io/install.sh | sh
```

### Windows (PowerShell):
```powershell
powershell -Command "iwr https://fly.io/install.ps1 -useb | iex"
```

### Linux:
```bash
curl -L https://fly.io/install.sh | sh
```

### Verify Installation:
```bash
fly version
```

---

## 🔐 Step 2: Sign Up & Login

```bash
# Create account (free, no credit card needed)
fly auth signup

# OR if you already have an account:
fly auth login
```

**Follow the prompts** - it will open a browser for authentication.

---

## 🚀 Step 3: Deploy to Fly.io

### 3.1 Initialize Fly App

```bash
# Make sure you're in the brandemen directory
cd /path/to/brandemen

# Launch your app (this will guide you through setup)
fly launch
```

**When prompted:**
- **App name**: `brandemen-chat` (or your preferred name)
- **Region**: Choose closest to your users:
  - `iad` - Virginia (US East)
  - `ord` - Chicago (US Central)  
  - `dfw` - Dallas (US Central)
  - `lhr` - London (Europe)
  - `sin` - Singapore (Asia)
- **Postgres**: `No`
- **Redis**: `No`
- **Deploy now**: `Yes`

### 3.2 Check Your Deployment

```bash
# Check status
fly status

# View logs (to see if it's working)
fly logs

# Open your app in browser
fly apps open
```

Your app will be available at: `https://brandemen-chat.fly.dev`

---

## 🔗 Step 4: Update Frontend

### 4.1 Update WebSocket URL

Open `app.js` and find line ~89, update:

```javascript
const WS_URL = isLocal 
    ? 'ws://localhost:3000'
    : 'wss://brandemen-chat.fly.dev'; // Your Fly.io URL
```

### 4.2 Commit & Push

```bash
git add app.js
git commit -m "Connect to Fly.io WebSocket server"
git push
```

### 4.3 Redeploy Frontend to Vercel

```bash
vercel --prod
```

---

## ✅ Step 5: Test Everything

### 5.1 Test Health Endpoint

```bash
# Check if server is running
curl https://brandemen-chat.fly.dev/health

# Should return: {"status":"ok","users":0,...}
```

### 5.2 Test Cross-Device Messaging

1. **Open your app** on desktop
2. **Open your app** on mobile (or another browser)
3. **Send messages** - they should appear on both!
4. **Test room switching** - verify rooms work

---

## 🛠️ Useful Fly.io Commands

```bash
# View app info
fly info

# View logs
fly logs

# Check status
fly status

# SSH into your app
fly ssh console

# View metrics
fly metrics

# Scale your app (when needed)
fly scale count 2

# Deploy updates
fly deploy

# Open your app
fly apps open

# Check secrets
fly secrets list
```

---

## 🎯 Your Live Setup

### URLs:
- **Frontend**: `https://brandemen.vercel.app` (Vercel)
- **Backend**: `https://brandemen-chat.fly.dev` (Fly.io)
- **WebSocket**: `wss://brandemen-chat.fly.dev` (Secure)

### Features:
- ✅ **Real-time messaging** across all devices
- ✅ **Room isolation** - messages stay in correct rooms
- ✅ **User presence** - see who's online
- ✅ **No cold starts** - always ready
- ✅ **Global CDN** - fast for everyone

---

## 💰 Cost

**Total: $0/month!**

- **Vercel**: Free (frontend hosting)
- **Fly.io**: Free (3 VMs, 160GB outbound transfer/month)
- **Total**: $0/month 🎉

---

## 🐛 Troubleshooting

### App Not Starting

```bash
# Check logs
fly logs

# Check status
fly status

# Restart app
fly apps restart
```

### WebSocket Not Connecting

1. Check your frontend URL is correct in `app.js`
2. Make sure you're using `wss://` (not `ws://`)
3. Check browser console for errors

### Slow Response Times

```bash
# Scale up your app
fly scale count 2
```

---

## 🎉 You're Done!

Your premium chat app is now live with:
- Real cross-device messaging
- Always-on availability (no sleep)
- Fast global performance
- Zero costs

**Enjoy your chat app!** 🚀

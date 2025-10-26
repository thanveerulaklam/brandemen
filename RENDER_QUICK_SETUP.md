# ⚡ Render.com Quick Setup - EXACT SETTINGS

## Fill These Fields:

| Field | Value |
|-------|-------|
| **Name** | `brandemen` |
| **Language** | `Node` |
| **Branch** | `main` |
| **Region** | `Singapore` (or closest to you) |
| **Root Directory** | *(leave empty)* |
| **Build Command** | `npm install` |
| **Start Command** | `node server.js` |
| **Instance Type** | `Free` |

## ✅ Click "Create Web Service"

**That's it!** Render will:
1. Install dependencies (`npm install`)
2. Start your server (`node server.js`)
3. Give you a URL like `https://brandemen.onrender.com`

**Deployment takes 3-5 minutes for the first time.**

---

## After Deployment:

1. Copy your Render URL (e.g., `https://brandemen.onrender.com`)
2. Open `app.js` in your editor
3. Find line ~89 and update:
   ```javascript
   const WS_URL = isLocal 
       ? 'ws://localhost:3000'
       : 'wss://brandemen.onrender.com'; // Your URL here
   ```
4. Save and push to GitHub
5. Redeploy Vercel frontend

🎉 **Done!**

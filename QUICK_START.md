# 🚀 Quick Start - Deploy to Railway

## Step 1: Create Railway Account

1. Go to https://railway.app
2. Sign up with GitHub (free)
3. Click "New Project"

## Step 2: Deploy from GitHub

1. Click "Deploy from GitHub repo"
2. Select your brandemen repository
3. Railway will auto-detect Node.js

## Step 3: Get Your URL

1. Railway will deploy automatically
2. Click on your project
3. Copy the **Public URL** (e.g., `brandemen-production.up.railway.app`)

## Step 4: Update Frontend

1. Open `app.js` in your editor
2. Find line ~66 and update:

```javascript
this.serverUrl = 'https://your-railway-url.railway.app';
// Replace with your actual Railway URL
```

3. Save the file

## Step 5: Redeploy Frontend

```bash
git add app.js
git commit -m "Update WebSocket server URL"
vercel --prod
```

## 🎉 Done!

Your app is now live with cross-device messaging!

### Test It:
1. Open on desktop: https://your-vercel-url.vercel.app
2. Open on phone: Same URL
3. Send messages - they appear on both! 💫

### Free Tier Limits:
- **Railway**: 500 hours/month, $5 credit
- **Vercel**: Unlimited bandwidth for personal projects
- **Total Cost**: $0/month! 🎉

---

**Need help?** Check the full [DEPLOYMENT.md](DEPLOYMENT.md) guide

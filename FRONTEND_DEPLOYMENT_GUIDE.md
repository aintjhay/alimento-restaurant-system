🚀 Frontend Deployment - Free Hosting Options for Beta Testing

Top 3 Recommended Options

1️⃣ **VERCEL** ⭐ (Recommended for React)
**Best for**: Fast deployment, generous free tier, preview URLs for testing

Deploy in 3 minutes:

```bash
# Install Vercel CLI
npm install -g vercel

# From project root
cd frontend
vercel
```

**Then answer prompts:**
- Confirm project name
- Framework: `React`
- Build command: (press enter for default)
- Output directory: `build`

**Result:**
- 🌐 Live URL: `https://your-project.vercel.app`
- ✅ Auto-redeploys on git push
- 🔗 Preview URLs for each PR
- 📊 Free tier generous (100GB bandwidth/month)

Configure Backend API:
Create `frontend/.env.production`:
```env
REACT_APP_API_URL=http://localhost:5000
```

Or add to Vercel dashboard:
- Settings → Environment Variables
- `REACT_APP_API_URL` = your production backend URL

---

2️⃣ **NETLIFY** 
**Best for**: GitHub integration, easy rollback, great for React

Deploy in 3 minutes:

```bash
# Option A: Direct CLI
npm install -g netlify-cli
cd frontend
netlify deploy --prod --dir=build
```

**Result:**
- 🌐 Live URL: `https://your-site.netlify.app`
- 🔄 Auto-deploy on git push
- 📊 Free tier: 300 minutes/month build time
- 🔗 Preview URLs included

Connect GitHub (auto-deploy):
1. Go to [netlify.com](https://netlify.com)
2. Click "New site from Git"
3. Connect GitHub repo
4. Set build command: `npm run build`
5. Set publish directory: `build`

---

3️⃣ **GITHUB PAGES** 
**Best for**: Quick, simple deployment, good for portfolios

Deploy steps:

1. Add to `frontend/package.json`:
```json
"homepage": "https://yourusername.github.io/alimento-restaurant-system"
```

2. Install package:
```bash
npm install --save-dev gh-pages
```

3. Add scripts to `package.json`:
```json
"predeploy": "npm run build",
"deploy": "gh-pages -d build"
```

4. Deploy:
```bash
npm run deploy
```

**Result:**
- 🌐 Live URL: `https://yourusername.github.io/alimento-restaurant-system`
- ⚠️ Static only (good for frontend testing)

---

🔄 How to Connect Frontend to Backend

For Local Testing
`frontend/src/services/api.js`:
```javascript
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
```

For Production

**Option 1: Free Backend + Free Frontend**
Use [Render.com](https://render.com) for backend:
1. Deploy backend to Render
2. Get production URL: `https://your-backend.onrender.com`
3. Set frontend env var to that URL

**Option 2: Keep Backend Local**
Frontend hosted, backend on local machine or cloud server

**Option 3: CORS Proxy** (if needed)
```javascript
// Use CORS proxy for cross-origin requests
const API_URL = `https://cors-anywhere.herokuapp.com/${backendURL}`;
```

---

📋 Step-by-Step: VERCEL (Quickest)

Prerequisites:
- GitHub account
- Node.js installed
- React app ready

Steps:

1. **Build your app locally** (test it works)
```bash
cd frontend
npm run build
```

2. **Sign up at vercel.com**
   - Click "Sign up"
   - Use GitHub (easiest)

3. **Deploy from CLI**
```bash
npm install -g vercel
vercel
```
   - Follow prompts
   - Confirm settings
   - Done!

4. **Get your URL**
   - Vercel shows it in terminal
   - Or check your Vercel dashboard
   - Share: `https://your-project.vercel.app`

Environment Variables (for API connection)
```bash
# In Vercel dashboard:
Settings → Environment Variables
- Add: REACT_APP_API_URL = <your-backend-url>
- Redeploy to apply
```

---

🧪 Beta Testing Features

Preview URLs (Vercel/Netlify)
Each code change gets unique preview URL:
- `https://your-site.vercel.app` (main/production)
- `https://feat-feature-name.vercel.app` (preview URLs)

Perfect for testing before merge!

Staging Environment
Option 1: Separate Vercel project for staging
Option 2: Use preview deployments for testing

---

💰 Free Tier Comparison

| Feature | Vercel | Netlify | GitHub Pages |
|---------|--------|---------|--------------|
| **Cost** | Free | Free | Free |
| **Bandwidth** | 100GB/mo | Unlimited | Limited |
| **Build time** | Unlimited | 300 min/mo | N/A |
| **Auto-deploy** | Yes | Yes | Yes |
| **Preview URLs** | Yes | Yes | No |
| **Environment vars** | Yes | Yes | No |
| **Custom domain** | Yes | Yes | Yes (paid) |
| **Best for React** | ⭐ | ⭐ | (Static) |

---

🔐 Security Notes for Beta Testing

1. **Never commit API keys**
   - Use environment variables
   - Use `.env.local` (not committed)

2. **HTTPS enforced**
   - All free options provide HTTPS

3. **Backend URL visibility**
   - Keep backend URL in `.env` secrets
   - Don't hardcode URLs

---

📱 Quick Deployment Checklist

- [ ] Backend running and tested
- [ ] Frontend `.env` files configured
- [ ] API endpoints tested locally
- [ ] `npm run build` succeeds
- [ ] No console errors
- [ ] Sign up for hosting service
- [ ] Deploy
- [ ] Test on live URL
- [ ] Share URL with beta testers

---

🚀 RECOMMENDED: Deploy with Vercel NOW

```bash
# 1. Install Vercel globally
npm install -g vercel

# 2. Go to frontend
cd frontend

# 3. Deploy
vercel

# 4. Follow prompts (all defaults OK)
# 5. Get your live URL! 🎉
```

**Time to deploy: 2-3 minutes**

---

📞 Need Custom Domain?

All free options support custom domains:
- Buy domain on Namecheap/GoDaddy (~$1-5/year)
- Point DNS to hosting provider
- Email configs provided by each host

---

⚠️ Important: Backend Access from Hosted Frontend

**If frontend is hosted externally**, backend needs to be accessible:

Option 1: Keep Backend Local During Beta
- Frontend on Vercel
- Backend runs on `localhost:5000` (only works for local testers)
- Beta testers must run backend locally

Option 2: Deploy Backend to Cloud (Free)
Deploy backend to free service:
- [Render.com](https://render.com) - Free tier
- [Railway.app](https://railway.app) - Free
- [Heroku](https://heroku.com) - Paid now, but was free
- [Replit](https://replit.com) - Free

Backend Deployment Example (Render.com):
1. Go to render.com
2. Create account
3. "New +" → "Web Service"
4. Connect GitHub repo
5. Build command: `npm install && npm run seed && npm start`
6. Start command: `npm start`
7. Environment: Add `MONGODB_URI` (use MongoDB Atlas free tier)
8. Deploy!

---

🎯 Complete Solution: Everything Free

| Component | Service | Cost |
|-----------|---------|------|
| Frontend | Vercel | FREE ✅ |
| Backend | Render.com | FREE ✅ |
| Database | MongoDB Atlas | FREE ✅ |
| Domain | Namecheap | ~$1/year |
| **Total Monthly** | - | **FREE** |

---

📝 Summary

**Fastest Option**: Vercel (3 minutes)
**Most Features**: Netlify (5 minutes)  
**Simplest Option**: GitHub Pages (10 minutes)

All are completely free for beta testing!

---

**Created**: February 25, 2026
**Status**: Ready for deployment

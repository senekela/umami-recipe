# Free Hosting Options for Python Flask Recipe Scraper

This guide covers the best **free** hosting platforms for deploying your Python Flask recipe scraper API.

## 🏆 Recommended: Railway.app (Best Free Option)

**Free Tier:** 500 hours/month, $5 credit/month  
**Perfect for:** This recipe scraper API

### Setup Steps

1. **Create account** at [railway.app](https://railway.app)

2. **Install Railway CLI** (optional):
```bash
npm install -g @railway/cli
railway login
```

3. **Deploy from GitHub** (Recommended):
   - Push your code to GitHub
   - Go to Railway dashboard
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your repository
   - Railway auto-detects Python and deploys!

4. **Or deploy via CLI**:
```bash
cd python-scraper
railway init
railway up
```

5. **Get your URL**:
   - Railway provides a public URL like `https://your-app.railway.app`
   - Use this in your Supabase Edge Function

### Railway Configuration

Create `railway.json` in `python-scraper/`:
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "gunicorn -w 4 -b 0.0.0.0:$PORT app:app",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

**Pros:**
- ✅ Easiest setup
- ✅ Auto-deploys from GitHub
- ✅ Generous free tier
- ✅ Custom domains
- ✅ Environment variables
- ✅ Automatic HTTPS

**Cons:**
- ⚠️ Sleeps after inactivity (but wakes quickly)

---

## 🥈 Render.com (Great Alternative)

**Free Tier:** 750 hours/month  
**Perfect for:** Production-ready deployments

### Setup Steps

1. **Create account** at [render.com](https://render.com)

2. **Create Web Service**:
   - Dashboard → "New" → "Web Service"
   - Connect your GitHub repository
   - Select `python-scraper` directory

3. **Configure**:
   - **Name:** recipe-scraper
   - **Environment:** Python 3
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `gunicorn -w 4 -b 0.0.0.0:$PORT app:app`
   - **Plan:** Free

4. **Deploy**:
   - Click "Create Web Service"
   - Render builds and deploys automatically
   - Get URL like `https://recipe-scraper.onrender.com`

### Render Configuration

Create `render.yaml` in project root:
```yaml
services:
  - type: web
    name: recipe-scraper
    env: python
    region: oregon
    plan: free
    buildCommand: pip install -r requirements.txt
    startCommand: gunicorn -w 4 -b 0.0.0.0:$PORT app:app
    envVars:
      - key: PYTHON_VERSION
        value: 3.11.0
```

**Pros:**
- ✅ Very reliable
- ✅ Auto-deploys from GitHub
- ✅ Free SSL
- ✅ Good documentation
- ✅ No credit card required

**Cons:**
- ⚠️ Spins down after 15 min inactivity (cold starts ~30s)

---

## 🥉 Fly.io (Developer Friendly)

**Free Tier:** 3 shared VMs, 160GB bandwidth/month  
**Perfect for:** Always-on services

### Setup Steps

1. **Install flyctl**:
```bash
# macOS
brew install flyctl

# Linux
curl -L https://fly.io/install.sh | sh

# Windows
powershell -Command "iwr https://fly.io/install.ps1 -useb | iex"
```

2. **Login**:
```bash
flyctl auth login
```

3. **Deploy**:
```bash
cd python-scraper
flyctl launch
# Follow prompts, select region
flyctl deploy
```

4. **Get URL**:
```bash
flyctl info
# URL: https://your-app.fly.dev
```

### Fly.io Configuration

Create `fly.toml` in `python-scraper/`:
```toml
app = "recipe-scraper"
primary_region = "iad"

[build]
  builder = "paketobuildpacks/builder:base"

[env]
  PORT = "8080"

[http_service]
  internal_port = 8080
  force_https = true
  auto_stop_machines = true
  auto_start_machines = true
  min_machines_running = 0

[[vm]]
  cpu_kind = "shared"
  cpus = 1
  memory_mb = 256
```

**Pros:**
- ✅ No cold starts (can keep 1 VM always on)
- ✅ Global edge network
- ✅ Great performance
- ✅ Docker-based

**Cons:**
- ⚠️ Requires credit card (but won't charge on free tier)
- ⚠️ Slightly more complex setup

---

## 🎯 PythonAnywhere (Python-Specific)

**Free Tier:** 1 web app, always-on  
**Perfect for:** Simple Python apps

### Setup Steps

1. **Create account** at [pythonanywhere.com](https://www.pythonanywhere.com)

2. **Upload code**:
   - Use Git or upload files via web interface
   - Or use their bash console

3. **Create Web App**:
   - Dashboard → "Web" → "Add a new web app"
   - Choose "Flask"
   - Python 3.10

4. **Configure WSGI**:
Edit `/var/www/yourusername_pythonanywhere_com_wsgi.py`:
```python
import sys
path = '/home/yourusername/python-scraper'
if path not in sys.path:
    sys.path.append(path)

from app import app as application
```

5. **Install dependencies**:
```bash
pip3.10 install --user -r requirements.txt
```

6. **Reload** and access at `https://yourusername.pythonanywhere.com`

**Pros:**
- ✅ Always-on (no cold starts)
- ✅ Python-focused
- ✅ Simple setup
- ✅ No credit card required

**Cons:**
- ⚠️ Limited to 100k requests/day
- ⚠️ Slower than other options
- ⚠️ Custom domains require paid plan

---

## 🚀 Vercel (with Python Runtime)

**Free Tier:** Unlimited deployments  
**Perfect for:** Serverless functions

### Setup Steps

1. **Install Vercel CLI**:
```bash
npm install -g vercel
```

2. **Create `vercel.json`** in `python-scraper/`:
```json
{
  "version": 2,
  "builds": [
    {
      "src": "app.py",
      "use": "@vercel/python"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "app.py"
    }
  ]
}
```

3. **Deploy**:
```bash
cd python-scraper
vercel
```

**Pros:**
- ✅ Instant deployments
- ✅ Global CDN
- ✅ No cold starts
- ✅ Great for serverless

**Cons:**
- ⚠️ 10s execution limit (may timeout on slow sites)
- ⚠️ Not ideal for long-running scrapes

---

## 📊 Comparison Table

| Platform | Free Tier | Cold Starts | Always-On | Setup Difficulty | Best For |
|----------|-----------|-------------|-----------|------------------|----------|
| **Railway** | 500h/month | ~2s | No | ⭐ Easy | Development |
| **Render** | 750h/month | ~30s | No | ⭐ Easy | Production |
| **Fly.io** | 3 VMs | None | Yes | ⭐⭐ Medium | Performance |
| **PythonAnywhere** | 1 app | None | Yes | ⭐⭐ Medium | Simple apps |
| **Vercel** | Unlimited | None | Yes | ⭐ Easy | Serverless |

---

## 🎯 Recommended Setup

### For Development/Testing
**Use Railway** - Easiest setup, generous free tier

### For Production
**Use Render or Fly.io** - More reliable, better performance

### Setup Instructions

1. **Deploy to Railway** (5 minutes):
```bash
# Push to GitHub
git add .
git commit -m "Add Python scraper"
git push

# Go to railway.app
# New Project → Deploy from GitHub → Select repo
# Done! Get your URL
```

2. **Update your Supabase Edge Function**:
```typescript
const PYTHON_SCRAPER_URL = 'https://your-app.railway.app';
```

3. **Test it**:
```bash
curl https://your-app.railway.app/health
```

---

## 🔧 Keeping Free Tier Active

### Railway
- Automatically stays active within 500 hours/month
- Monitor usage in dashboard

### Render
- Add a cron job to ping your API every 14 minutes:
```bash
# Use cron-job.org or similar
curl https://your-app.onrender.com/health
```

### Fly.io
- Set `min_machines_running = 1` in `fly.toml` to keep always-on

---

## 💡 Pro Tips

1. **Use Railway for quick start** - Deploy in 5 minutes
2. **Add health check endpoint** - Already included in `app.py`
3. **Monitor usage** - Check platform dashboards regularly
4. **Set up alerts** - Get notified if API goes down
5. **Use environment variables** - For configuration
6. **Enable auto-deploy** - Push to GitHub = auto-deploy

---

## 🆘 Troubleshooting

### "Application failed to start"
- Check logs in platform dashboard
- Verify `requirements.txt` is correct
- Ensure `gunicorn` is in dependencies

### "Port binding error"
- Use `$PORT` environment variable:
```python
port = int(os.environ.get('PORT', 5001))
app.run(host='0.0.0.0', port=port)
```

### "Cold start too slow"
- Use Fly.io with always-on VM
- Or use PythonAnywhere
- Or add warming pings

---

## 📚 Additional Resources

- [Railway Documentation](https://docs.railway.app/)
- [Render Documentation](https://render.com/docs)
- [Fly.io Documentation](https://fly.io/docs/)
- [PythonAnywhere Help](https://help.pythonanywhere.com/)

---

## ✅ Next Steps

1. Choose a platform (Railway recommended)
2. Deploy your Python scraper
3. Get your public URL
4. Update your app to use the URL
5. Test with real recipes
6. Monitor and optimize

**Need help?** Check the platform-specific documentation or open an issue!
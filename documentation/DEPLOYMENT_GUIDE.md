# 🚀 Complete Step-by-Step Deployment Guide

This guide walks you through deploying Fytepycker to free hosting from start to finish.

**Estimated Time:** 30-45 minutes  
**Cost:** $0/month

---

## Prerequisites

- [ ] GitHub account (free)
- [ ] Code pushed to GitHub repository
- [ ] 30-45 minutes of time

---

## Step 1: Set Up Free Database (Neon) 📊

### 1.1 Create Neon Account

1. Go to [neon.tech](https://neon.tech)
2. Click **"Sign Up"** or **"Get Started"**
3. Sign up with GitHub (easiest)

### 1.2 Create New Project

1. Once logged in, click **"Create a project"** or **"New Project"**
2. Fill in:
   - **Name:** `fytepycker` (or your choice)
   - **Region:** Choose closest to you (US East (AWS) is usually good)
   - **PostgreSQL Version:** Latest (15 or 16)
   - **Plane:** Free (should be selected by default)
3. Click **"Create Project"**
4. Wait 1-2 minutes for project to be created

### 1.3 Get Database Connection String

1. Once project is ready, you'll see your project dashboard
2. Look for **"Connection string"** or **"Connection Details"** section
3. You should see a connection string that looks like:
   ```
   postgresql://username:password@ep-xxx-xxx.region.aws.neon.tech/dbname?sslmode=require
   ```
4. If you don't see it immediately:
   - Click on **"Connection Details"** or the database name
   - Look for **"Connection string"** or **"Connection URI"**
   - You might need to click **"Show connection string"**
5. Copy the entire connection string
6. **Save this somewhere safe!** You'll need it soon.
7. **Also save your password** - Neon generates one for you, save it!

**✅ Database Done!** You now have a free PostgreSQL database on Neon.

---

## Step 2: Set Up Free Redis (Upstash) 🔴

### 2.1 Create Upstash Account

1. Go to [upstash.com](https://upstash.com)
2. Click **"Sign Up"**
3. Sign up with GitHub (easiest)

### 2.2 Create Redis Database

1. Click **"Create Database"**
2. Fill in:
   - **Name:** `fytepycker-redis` (or your choice)
   - **Type:** Redis
   - **Region:** Choose closest to you (Global is good for worldwide)
   - **Primary Region:** Choose your region
   - **TLS:** Enabled (default)
   - **Eviction:** Enabled (default)
   - **Plan:** Free (should be selected by default)
3. Click **"Create"**

### 2.3 Get Redis Connection URL

1. Once created, you'll see your database details
2. Click on the database name to open details
3. Find **"REST URL"** - it starts with `https://`
4. Copy the entire URL
5. **Save this somewhere safe!** You'll need it soon.

**✅ Redis Done!** You now have free Redis for WebSockets.

---

## Step 3: Set Up GitHub Actions 🤖

### 3.1 Go to Your GitHub Repository

1. Go to your repository on GitHub
2. Make sure your code is pushed to GitHub

### 3.2 Add Repository Secrets

1. Click **"Settings"** (top menu of your repo)
2. In left sidebar, click **"Secrets and variables"** → **"Actions"**
3. Click **"New repository secret"**
4. Add these secrets one by one:

#### Secret 1: DATABASE_URL

- **Name:** `DATABASE_URL`
- **Value:** Paste your Neon connection string from Step 1.3
- Click **"Add secret"**

#### Secret 2: SECRET_KEY

- **Name:** `SECRET_KEY`
- **Value:** Generate a Django secret key:
  - Run this locally: `python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"`
  - Or use an online generator: https://djecrety.ir/
  - Copy the generated key
- Click **"Add secret"**

#### Secret 3: REDIS_URL

- **Name:** `REDIS_URL`
- **Value:** Paste your Upstash Redis URL from Step 2.3
- Click **"Add secret"**

### 3.3 Verify GitHub Actions Workflow Exists

1. Go to your repository
2. Navigate to `.github/workflows/` folder
3. You should see `daily-scrape.yml`
4. If not, make sure you've pushed the latest code with the GitHub Actions workflow

**✅ GitHub Actions Done!** Daily scraping will run automatically at midnight UTC.

---

## Step 4: Deploy to Render (Free Hosting) 🌐

### 4.1 Create Render Account

1. Go to [render.com](https://render.com)
2. Click **"Get Started for Free"**
3. Sign up with GitHub (easiest - connects your repos)

### 4.2 Create Web Service

1. Once logged in, click **"New +"** (top right)
2. Click **"Web Service"**
3. Connect your GitHub repository:
   - Click **"Connect account"** if needed
   - Select your repository from the list
   - Click **"Connect"**

### 4.3 Configure Web Service

Fill in the configuration:

#### Basic Settings:

- **Name:** `fytepycker` (or your choice)
- **Region:** Choose closest to you
- **Branch:** `main` (or your default branch)
- **Root Directory:** Leave blank
- **Environment:** `Docker`
- **Dockerfile Path:** `Dockerfile` (should auto-detect)
- **Docker Build Command:** Leave blank (Docker handles it)
- **Docker Start Command:** `./entrypoint.sh web`

#### Instance Type:

- **Instance Type:** Free (512 MB RAM)
- This is free but will spin down after 15 min of inactivity (wakes up when accessed)

#### Advanced Settings (Expand to see):

- **Build Command:** Leave blank (Docker handles it)
- **Start Command:** Leave blank (Dockerfile already has ENTRYPOINT and CMD set)

### 4.4 Add Environment Variables

Scroll down to **"Environment Variables"** section and add:

#### Variable 1: DATABASE_URL

- **Key:** `DATABASE_URL`
- **Value:** Your Neon connection string from Step 1.3
- Click **"Add"**

#### Variable 2: REDIS_URL

- **Key:** `REDIS_URL`
- **Value:** Your Upstash Redis URL from Step 2.3
- Click **"Add"**

#### Variable 3: SECRET_KEY

- **Key:** `SECRET_KEY`
- **Value:** Same secret key you used in GitHub Actions (Step 3.2)
- Click **"Add"**

#### Variable 4: DEBUG

- **Key:** `DEBUG`
- **Value:** `False`
- Click **"Add"**

#### Variable 5: ALLOWED_HOSTS

- **Key:** `ALLOWED_HOSTS`
- **Value:** `your-app-name.onrender.com` (you'll get this after deployment)
- Click **"Add"**
- **Note:** You'll need to update this after deployment with your actual URL

#### Variable 6: FRONTEND_URLS

- **Key:** `FRONTEND_URLS`
- **Value:** `https://your-app-name.onrender.com`
- Click **"Add"**
- **Note:** Update with your actual URL after deployment

#### Variable 7: PORT (Optional - Render sets this automatically)

- Render automatically sets `PORT` variable, so you don't need to add this

### 4.5 Deploy!

1. Scroll to bottom
2. Click **"Create Web Service"**
3. Wait 5-10 minutes for first deployment

### 4.6 Update Environment Variables with Your URL

Once deployment starts:

1. You'll see your app URL (like: `fytepycker-xxxx.onrender.com`)
2. Copy this URL
3. Go to **"Environment"** tab in Render dashboard
4. Update:
   - `ALLOWED_HOSTS` = `your-actual-url.onrender.com`
   - `FRONTEND_URLS` = `https://your-actual-url.onrender.com`
5. Click **"Save Changes"**
6. Render will automatically redeploy

**✅ Deployment Done!** Your app is now live!

---

## Step 5: Verify Everything Works ✅

### 5.1 Check Your App is Live

1. Visit your Render URL: `https://your-app-name.onrender.com`
2. You should see your app (might take 30 seconds to wake up if it's sleeping)

### 5.2 Check GitHub Actions

1. Go to your GitHub repository
2. Click **"Actions"** tab
3. You should see the "Daily UFC Scrape" workflow
4. Wait until midnight UTC (or manually trigger it) to verify it works

### 5.3 Test WebSockets

1. Open your app in browser
2. Open browser console (F12)
3. Look for WebSocket connection messages
4. Should see: `[WS connected] matchup X`

### 5.4 Test Scraping (Optional)

1. Go to your app's admin: `https://your-app-name.onrender.com/admin`
2. Log in with your admin account
3. Or test via API if you have authentication set up

---

## Step 6: Optional - Set Up Custom Domain (Later) 🌍

If you want a custom domain later:

1. In Render dashboard, go to **"Settings"**
2. Scroll to **"Custom Domains"**
3. Add your domain
4. Update DNS records as instructed
5. Update `ALLOWED_HOSTS` and `FRONTEND_URLS` environment variables

---

## Troubleshooting 🔧

### App Won't Start

- **Check logs:** Go to Render dashboard → "Logs" tab
- **Check environment variables:** Make sure all are set correctly
- **Check database connection:** Verify DATABASE_URL is correct

### Database Connection Failed

- **Check DATABASE_URL:** Make sure connection string is correct
- **Check Neon:** Make sure project is active (go to Neon dashboard)
- **Check password:** Verify password in connection string matches
- **Check SSL mode:** Neon requires SSL, make sure connection string includes `?sslmode=require`

### Redis Connection Failed

- **Check REDIS_URL:** Make sure Upstash URL is correct
- **Check Upstash dashboard:** Verify database is active
- **Check command limits:** Free tier has 10K commands/day limit

### GitHub Actions Not Running

- **Check secrets:** Make sure all secrets are set in GitHub
- **Check workflow file:** Verify `.github/workflows/daily-scrape.yml` exists
- **Check Actions tab:** Look for errors in workflow runs

### App is Slow to Load

- **Free tier limitation:** Free Render instances spin down after 15 min inactivity
- **First request:** May take 30-60 seconds to wake up
- **Solution:** This is normal for free tier. Paid tier doesn't have this.

### WebSockets Not Working

- **Check Redis:** Verify REDIS_URL is correct
- **Check Upstash limits:** Free tier has 10K commands/day
- **Check browser console:** Look for WebSocket errors

---

## Cost Summary 💰

| Service        | Cost         | Notes                                             |
| -------------- | ------------ | ------------------------------------------------- |
| Neon Database  | $0           | Free tier: 0.5GB storage, 2 branches              |
| Upstash Redis  | $0           | Free tier: 10K commands/day                       |
| GitHub Actions | $0           | Free for public repos                             |
| Render Hosting | $0           | Free tier: 512MB RAM, spins down after inactivity |
| **Total**      | **$0/month** | ✅                                                |

---

## Next Steps 🎯

1. **Monitor Usage:**

   - Check Neon dashboard for database usage
   - Check Upstash dashboard for Redis usage
   - Check Render logs for app health

2. **Set Up Monitoring:**

   - Consider adding error tracking (Sentry free tier)
   - Set up uptime monitoring (UptimeRobot free tier)

3. **Optimize:**
   - Monitor database query performance
   - Check Redis command usage
   - Optimize if you approach limits

---

## Quick Reference: Your URLs

After deployment, save these:

- **App URL:** `https://your-app-name.onrender.com`
- **Neon Dashboard:** https://console.neon.tech
- **Upstash Dashboard:** https://console.upstash.com
- **Render Dashboard:** https://dashboard.render.com
- **GitHub Actions:** `https://github.com/your-username/your-repo/actions`

---

## Success Checklist ✅

- [ ] Database set up on Neon
- [ ] Redis set up on Upstash
- [ ] GitHub Actions secrets configured
- [ ] App deployed to Render
- [ ] Environment variables set correctly
- [ ] App is accessible via URL
- [ ] WebSockets working
- [ ] GitHub Actions workflow exists

**Congratulations! Your app is now live for FREE! 🎉**

---

## Need Help?

- **Render Docs:** https://render.com/docs
- **Neon Docs:** https://neon.tech/docs
- **Upstash Docs:** https://docs.upstash.com
- **Check your migration guides:** See `FREE_HOSTING_MIGRATION.md` for more details

---

**Time to deployment:** ~30-45 minutes  
**Monthly cost:** $0  
**You're all set!** 🚀

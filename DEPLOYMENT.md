# 🚀 Deploying AI Notes App to Render

This guide provides step-by-step instructions to deploy the AI Notes App on [Render](https://render.com) with a free MongoDB Atlas database.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Step 1: Set Up MongoDB Atlas](#step-1-set-up-mongodb-atlas-free-database)
3. [Step 2: Get NVIDIA API Key](#step-2-get-nvidia-api-key)
4. [Step 3: Push Code to GitHub](#step-3-push-code-to-github)
5. [Step 4: Deploy on Render](#step-4-deploy-on-render)
6. [Step 5: Configure Environment Variables](#step-5-configure-environment-variables)
7. [Step 6: Verify Deployment](#step-6-verify-deployment)
8. [Troubleshooting](#troubleshooting)
9. [Optional Configurations](#optional-configurations)

---

## Prerequisites

Before deploying, ensure you have:

- ✅ GitHub account
- ✅ Render account (free)
- ✅ MongoDB Atlas account (free)
- ✅ NVIDIA Developer account (for API key)
- ✅ Your code pushed to a GitHub repository

---

## Step 1: Set Up MongoDB Atlas (Free Database)

MongoDB Atlas provides a free tier (M0) that's perfect for this application.

### 1.1 Create an Account

1. Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Click **"Try Free"**
3. Sign up with Google or Email

### 1.2 Create a Free Cluster

1. Click **"Build a Database"**
2. Select **"M0 FREE"** tier (Shared)
3. Choose your cloud provider:
   - **AWS** (recommended)
   - Region: `us-east-1` or closest to your users
4. Cluster name: `ai-notes-cluster` (or keep default)
5. Click **"Create Deployment"**

### 1.3 Create Database User

1. In the popup, create a database user:
   - **Username**: `appuser`
   - **Password**: Click "Autogenerate Secure Password"
   - ⚠️ **SAVE THIS PASSWORD** - you'll need it later!
2. Click **"Create User"**

### 1.4 Configure Network Access

1. Click **"Network Access"** in the left sidebar
2. Click **"Add IP Address"**
3. Click **"Allow Access from Anywhere"**
   - This adds `0.0.0.0/0` to the whitelist
   - Required for Render to connect (Render uses dynamic IPs)
4. Click **"Confirm"**

### 1.5 Get Connection String

1. Click **"Database"** in the left sidebar
2. Click **"Connect"** button on your cluster
3. Select **"Drivers"**
4. Copy the connection string:

```
mongodb+srv://appuser:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
```

5. **Modify the connection string:**
   - Replace `<password>` with your actual password
   - Add database name before `?`: `/ai-notes-app?`

**Final connection string format:**
```
mongodb+srv://appuser:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/ai-notes-app?retryWrites=true&w=majority
```

---

## Step 2: Get NVIDIA API Key

The app uses NVIDIA's AI APIs for LLM and embeddings.

### 2.1 Create NVIDIA Developer Account

1. Go to [build.nvidia.com](https://build.nvidia.com/)
2. Click **"Sign In"** or **"Join Now"**
3. Create an NVIDIA account if you don't have one

### 2.2 Get API Key

1. Navigate to any model page (e.g., LLaMA 3.1)
2. Click **"Get API Key"** or **"Build with this NIM"**
3. Generate a new API key
4. Copy the key (starts with `nvapi-`)
5. ⚠️ **SAVE THIS KEY** - it won't be shown again!

---

## Step 3: Push Code to GitHub

If your code isn't already on GitHub:

```bash
# Initialize git repository
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit: AI Notes App"

# Add remote repository
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git

# Push to GitHub
git branch -M main
git push -u origin main
```

---

## Step 4: Deploy on Render

### 4.1 Create Render Account

1. Go to [render.com](https://render.com)
2. Click **"Get Started for Free"**
3. **Sign up with GitHub** (recommended for easy repo connection)

### 4.2 Create Web Service

1. Click **"New +"** in the top navigation
2. Select **"Web Service"**

### 4.3 Connect Repository

1. Click **"Connect a repository"**
2. If prompted, authorize Render to access your GitHub
3. Find and select your repository
4. Click **"Connect"**

### 4.4 Configure Build Settings

Fill in the following settings:

| Setting | Value |
|---------|-------|
| **Name** | `ai-notes-app` (or your preferred name) |
| **Region** | `Oregon (US West)` (or closest to your users) |
| **Branch** | `main` |
| **Root Directory** | Leave empty |
| **Runtime** | `Node` |
| **Build Command** | `npm run build` |
| **Start Command** | `npm start` |
| **Instance Type** | `Free` |

---

## Step 5: Configure Environment Variables

Scroll down to the **"Environment Variables"** section and add each variable:

### Required Variables

| Key | Value | Description |
|-----|-------|-------------|
| `NODE_ENV` | `production` | Enables production optimizations |
| `PORT` | `5000` | Server port |
| `MONGODB_URI` | Your MongoDB connection string | Database connection |
| `NVIDIA_API_KEY` | `nvapi-xxxxx` | Your NVIDIA API key |
| `JWT_SECRET` | Click "Generate" | Authentication secret |

### NVIDIA Configuration

| Key | Value |
|-----|-------|
| `NVIDIA_BASE_URL` | `https://integrate.api.nvidia.com/v1` |
| `NVIDIA_LLM_MODEL` | `meta/llama-3.1-8b-instruct` |
| `NVIDIA_EMBEDDING_MODEL` | `nvidia/nv-embedqa-e5-v5` |
| `NVIDIA_EMBEDDING_DIMENSION` | `1024` |

### JWT Configuration

| Key | Value |
|-----|-------|
| `JWT_SECRET` | (click Generate for random value) |
| `JWT_EXPIRE` | `7d` |
| `JWT_COOKIE_EXPIRE` | `7` |

### Rate Limiting

| Key | Value |
|-----|-------|
| `RATE_LIMIT_WINDOW_MS` | `900000` |
| `RATE_LIMIT_MAX_REQUESTS` | `100` |

### Complete Environment Variables Screenshot Reference

```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://appuser:password@cluster0.xxxxx.mongodb.net/ai-notes-app?retryWrites=true&w=majority
NVIDIA_API_KEY=nvapi-xxxxxxxxxxxxxxxxxxxx
NVIDIA_BASE_URL=https://integrate.api.nvidia.com/v1
NVIDIA_LLM_MODEL=meta/llama-3.1-8b-instruct
NVIDIA_EMBEDDING_MODEL=nvidia/nv-embedqa-e5-v5
NVIDIA_EMBEDDING_DIMENSION=1024
JWT_SECRET=your-super-secret-key-min-32-characters
JWT_EXPIRE=7d
JWT_COOKIE_EXPIRE=7
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

---

## Step 6: Verify Deployment

### 6.1 Start Deployment

1. Click **"Create Web Service"**
2. Render will start building your application
3. Build typically takes 5-10 minutes

### 6.2 Monitor Build Logs

Watch the logs for:

```
==> Building...
==> Installing dependencies...
==> Build successful!
==> Deploying...
```

### 6.3 Check Application Logs

After deployment, look for:

```
🚀 AI Notes Server running on http://localhost:5000
📦 MongoDB Connected: cluster0.xxxxx.mongodb.net
```

### 6.4 Access Your App

Render provides a URL like:
```
https://ai-notes-app.onrender.com
```

Open this URL in your browser to access your deployed app!

---

## Troubleshooting

### Build Failures

**Error: `npm ERR! missing script: build`**
- Ensure your `package.json` has a `build` script
- Check that the root directory is correct

**Error: `Cannot find module 'xxx'`**
- Ensure all dependencies are in `package.json`
- Check that `npm install` runs correctly locally

### MongoDB Connection Issues

**Error: `MongoNetworkError: connection refused`**

1. Verify your connection string is correct
2. Check Network Access in MongoDB Atlas allows `0.0.0.0/0`
3. Ensure the database name is included in the URI
4. URL-encode special characters in password:
   - `@` → `%40`
   - `#` → `%23`
   - `$` → `%24`

### Application Crashes

**Error: `Application failed to respond`**

1. Check Render logs for specific errors
2. Verify all environment variables are set
3. Ensure `PORT` is set to `5000`
4. Check that `npm start` works locally in production mode

### NVIDIA API Issues

**Error: `NVIDIA API key not configured`**

1. Verify `NVIDIA_API_KEY` is set in environment variables
2. Ensure the key starts with `nvapi-`
3. Check the key hasn't expired

---

## Optional Configurations

### Keep App Awake (Prevent Sleep)

Render's free tier sleeps after 15 minutes of inactivity. To prevent this:

1. Sign up at [uptimerobot.com](https://uptimerobot.com)
2. Create a new monitor:
   - **Monitor Type**: HTTP(s)
   - **URL**: `https://your-app.onrender.com/health`
   - **Monitoring Interval**: 5 minutes
3. This pings your app regularly to keep it awake

### Custom Domain

1. Go to your Render service → **Settings**
2. Scroll to **Custom Domains**
3. Click **"Add Custom Domain"**
4. Enter your domain (e.g., `notes.yourdomain.com`)
5. Update your DNS records as instructed

### Auto-Deploy on Git Push

By default, Render auto-deploys when you push to your branch. To disable:

1. Go to **Settings** → **Build & Deploy**
2. Toggle off **"Auto-Deploy"**

---

## Cost Considerations

### Free Tier Limits

| Resource | Limit |
|----------|-------|
| **Web Services** | 750 hours/month |
| **Bandwidth** | 100 GB/month |
| **Build Minutes** | 500 minutes/month |
| **Sleep** | After 15 min inactivity |

### Upgrading

If you need more resources:
- **Starter Plan**: $7/month - No sleep, more RAM
- **Pro Plan**: $25/month - Even more resources

---

## Security Checklist

Before going live, ensure:

- [ ] Strong JWT_SECRET (64+ characters)
- [ ] MongoDB user has limited permissions
- [ ] NVIDIA API key is not committed to git
- [ ] Rate limiting is configured
- [ ] HTTPS is enabled (automatic on Render)

---

## Support

- **Render Docs**: [render.com/docs](https://render.com/docs)
- **MongoDB Atlas Docs**: [docs.atlas.mongodb.com](https://docs.atlas.mongodb.com)
- **NVIDIA Build Docs**: [build.nvidia.com/docs](https://build.nvidia.com/docs)

---

## Summary

You've successfully deployed the AI Notes App! 🎉

Your app is now running at: `https://your-app-name.onrender.com`

Features available:
- ✅ User authentication
- ✅ Create, edit, delete notes
- ✅ AI-powered title generation
- ✅ Smart summarization
- ✅ Key points extraction
- ✅ Semantic search
- ✅ AI chat with your notes (RAG)

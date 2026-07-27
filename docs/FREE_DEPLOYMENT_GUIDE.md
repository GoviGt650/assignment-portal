# Free Deployment Guide — Always Available for Teacher & Students

This guide deploys **Terralogic Assignment Portal** at **$0/month** so your teacher and classmates can access it from anywhere via a public URL.

---

## What You Get (Free Stack)

| Part | Service | Cost | Always online? |
|------|---------|------|----------------|
| Website (React) | **Vercel** | Free | ✅ Yes — instant load |
| API (Express) | **Render** | Free | ⚠️ Sleeps after 15 min idle (~30–60s wake-up) |
| Database | **Neon** | Free | ✅ Yes |
| File uploads | **Supabase Storage** | Free 1 GB | ✅ Persists forever |

**Total cost: $0**

---

## Honest Limitations (Read This First)

### 1. Backend “cold start” on Render free tier
If nobody uses the app for ~15 minutes, the API sleeps. The **first click** after that may take **30–60 seconds** to respond. After that it’s fast until idle again.

**Fix (free):** Use [UptimeRobot](https://uptimerobot.com) to ping your API every 5 minutes (see Step 6).

### 2. Uploaded files — use Supabase Storage (included in this guide)
PDFs and ZIPs are stored in **Supabase Storage** (free 1 GB), not on Render’s disk. Files **survive redeploys** and restarts.

### 3. SQLite does NOT work in production
You must use **PostgreSQL (Neon)** when deployed. Set `USE_SQLITE=false`.

---

## Architecture After Deployment

```
Students & Teacher
       │
       ▼
https://your-app.vercel.app          ← Frontend (Vercel)
       │
       │  API calls
       ▼
https://your-api.onrender.com/api    ← Backend (Render)
       │
       ├──► Neon PostgreSQL           ← Users, assignments, submissions
       └──► Supabase Storage          ← PDFs & ZIPs (permanent, free 1 GB)
```

---

## Prerequisites

- [ ] GitHub account (free)
- [ ] Code pushed to a GitHub repository
- [ ] ~45 minutes for first-time setup

---

## Step 1 — Push Project to GitHub

Open PowerShell in your project folder:

```powershell
cd "c:\Users\vendi\OneDrive\Desktop\AssignmentSubmitter"

git init
git add .
git commit -m "Assignment portal ready for deployment"

# Create a new repo on github.com first, then:
git remote add origin https://github.com/YOUR_USERNAME/assignment-portal.git
git branch -M main
git push -u origin main
```

> **Important:** Never commit `.env` files — they are already in `.gitignore`.

---

## Step 2 — Create Free Database (Neon)

1. Go to [https://neon.tech](https://neon.tech) → Sign up (free)
2. **New Project** → name it `assignment-portal`
3. Copy the **connection string** (starts with `postgresql://...`)
   - Use the one with `?sslmode=require`
4. Open **SQL Editor** in Neon
5. Copy everything from `database/schema.sql` in your project → **Run**

You should see tables: `users`, `assignments`, `submissions`.

---

## Step 3 — Supabase Storage (Permanent File Uploads)

1. Go to [https://supabase.com](https://supabase.com) → Sign up (free)
2. **New project** → name `assignment-portal`
3. **Project Settings** → **API** → copy:
   - **Project URL** (`https://xxxxx.supabase.co`)
   - **service_role** key (secret — backend only, never in frontend)
4. Add these to Render env vars in the next step (already listed below)

The backend auto-creates private buckets `assignments` and `submissions` on first startup.

---

## Step 4 — Deploy Backend on Render

1. Go to [https://render.com](https://render.com) → Sign up with GitHub
2. **New +** → **Web Service**
3. Connect your GitHub repo
4. Configure:

| Field | Value |
|-------|--------|
| Name | `assignment-portal-api` |
| Root Directory | `backend` |
| Runtime | Node |
| Build Command | `npm install` |
| Start Command | `npm start` |
| Instance Type | **Free** |

5. **Environment Variables** — add each of these:

```
USE_SQLITE=false
NODE_ENV=production
PORT=8000
DATABASE_URL=paste-your-neon-connection-string-here
JWT_SECRET=make-a-long-random-string-at-least-32-characters
JWT_EXPIRES_IN=7d
FRONTEND_URL=https://PLACEHOLDER.vercel.app
TEACHER_USERNAME=teacher
TEACHER_PASSWORD=ChooseAStrongPassword123!
MAX_FILE_SIZE_MB=200
STORAGE_TYPE=supabase
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

6. Click **Create Web Service** → wait for deploy (~5 min)
7. Copy your API URL, e.g. `https://assignment-portal-api.onrender.com`
8. Test in browser: `https://YOUR-API.onrender.com/api/health`  
   Should show: `{"status":"ok",...}`

### Seed teacher account (one time)

1. Render Dashboard → your service → **Shell** tab
2. Run:

```bash
npm run db:seed
```

3. You should see: `Teacher account created: teacher / YourPassword`

---

## Step 4 — Deploy Frontend on Vercel

1. Go to [https://vercel.com](https://vercel.com) → Sign up with GitHub
2. **Add New Project** → import your repo
3. Configure:

| Field | Value |
|-------|--------|
| Root Directory | `frontend` |
| Framework Preset | Vite |
| Build Command | `npm run build` |
| Output Directory | `dist` |

4. **Environment Variable:**

```
VITE_API_URL=https://YOUR-RENDER-URL.onrender.com/api
```

Replace `YOUR-RENDER-URL` with your actual Render URL from Step 3.

5. Click **Deploy**
6. Copy your site URL, e.g. `https://assignment-portal.vercel.app`

---

## Step 5 — Connect Frontend and Backend (CORS)

1. Go back to **Render** → your backend service → **Environment**
2. Update:

```
FRONTEND_URL=https://your-actual-vercel-url.vercel.app
```

3. Save → Render will **redeploy automatically**

Now open your Vercel URL and try logging in as teacher.

---

## Step 6 — Keep API Awake (Free “Always On” Trick)

Render free tier sleeps when idle. Reduce this with a free monitor:

1. Go to [https://uptimerobot.com](https://uptimerobot.com) → free account
2. **Add Monitor:**
   - Type: HTTP(s)
   - URL: `https://YOUR-RENDER-URL.onrender.com/api/health`
   - Interval: **5 minutes**
3. Save

This pings your API regularly so it stays awake most of the time. Not 100% guaranteed, but much better for daily class use.

---

## Step 7 — Share With Teacher & Classmates

Send them:

```
Portal URL:  https://your-app.vercel.app

Teacher login:
  Username: teacher
  Password: (the one you set in Render TEACHER_PASSWORD)

Students:
  Click "Create an account" on the login page to register.
```

---

## Deployment Checklist

```
[ ] GitHub repo created and code pushed
[ ] Neon project created + schema.sql executed
[ ] Render backend deployed (USE_SQLITE=false)
[ ] npm run db:seed run in Render Shell
[ ] /api/health returns OK
[ ] Vercel frontend deployed with VITE_API_URL
[ ] FRONTEND_URL updated on Render
[ ] Teacher can login on live site
[ ] Student can register and see assignments
[ ] UptimeRobot pinging /api/health every 5 min
[ ] Changed default teacher password from teacher123
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Login fails on live site | Check `USE_SQLITE=false` and `DATABASE_URL` on Render; run `db:seed` again |
| CORS error in browser | `FRONTEND_URL` on Render must exactly match Vercel URL (no trailing slash) |
| API very slow first time | Normal on Render free — wait 30–60s or set up UptimeRobot |
| Uploaded PDFs missing after redeploy | Set `STORAGE_TYPE=supabase` + Supabase keys (Step 3b) |
| `Invalid token` after deploy | Clear browser localStorage and login again |
| Build fails on Vercel | Ensure Root Directory is `frontend`, not project root |

---

## Option B — Truly Always-On (Still Free, More Setup)

If cold starts are unacceptable, use **Oracle Cloud Always Free VM**:

- 4 ARM cores + 24 GB RAM — **free forever**
- Run backend + serve frontend from one server
- Never sleeps

Trade-off: Linux server setup (Node, PM2, Nginx) — harder than Render/Vercel.

Good tutorials: search *"Oracle Cloud free tier deploy Node.js app"*.

---

## Option C — Paid Upgrade (If Budget Allows Later)

| Upgrade | Cost | Benefit |
|---------|------|---------|
| Render Starter | ~$7/month | No sleep, persistent disk |
| Supabase Pro | Free tier often enough | DB + file storage together |

---

## Environment Variables Quick Reference

### Render (Backend)

```env
USE_SQLITE=false
NODE_ENV=production
DATABASE_URL=postgresql://...@neon.tech/...
JWT_SECRET=your-secret
FRONTEND_URL=https://your-app.vercel.app
TEACHER_USERNAME=teacher
TEACHER_PASSWORD=your-strong-password
PORT=8000
```

### Vercel (Frontend)

```env
VITE_API_URL=https://your-api.onrender.com/api
```

---

## Updating the Live Site Later

When you change code locally:

```powershell
git add .
git commit -m "Describe your change"
git push
```

- **Vercel** redeploys frontend automatically
- **Render** redeploys backend automatically

No extra steps needed after the first setup.

---

## Security Before Sharing Publicly

1. ✅ Strong `TEACHER_PASSWORD` (not `teacher123`)
2. ✅ Random `JWT_SECRET` (32+ characters)
3. ✅ Never share teacher password in WhatsApp groups — tell teacher privately
4. ✅ Students only see their own submissions (built into the app)

---

## Summary

| Goal | Best free approach |
|------|-------------------|
| Share URL with class | Vercel + Render + Neon |
| Reduce sleep delays | UptimeRobot ping every 5 min |
| Keep uploads forever | Supabase Storage (Step 3b) — already built in |
| 100% always-on, $0 | Oracle Cloud free VM |

**Recommended path for your class:** Follow Steps 1–7 above. Total time ~45 minutes, $0 cost, good enough for teacher + students daily use.

---

*Related: [PROJECT_DOCUMENTATION.md](./PROJECT_DOCUMENTATION.md) for how the code works internally.*

# Terralogic Assignment Portal

A centralized **Assignment Submission Portal (ASP)** for teachers and students. Replace WhatsApp PDF sharing and manual Git tracking with a single web app for publishing assignments, submitting work, and tracking submissions.

## Features

### Teacher
- Secure login and professional account settings (username/password)
- Create assignments with PDF, description, and **date-only deadline**
- Card-based assignment management with submission counts
- Compact submissions table with **assignment filter**, search, and status filters
- **Colored status** dropdown (pending, submitted, reviewed, late)
- **Preview** student submissions (PDF, images, text; ZIP with download prompt)
- **Download** submissions with filenames like `studentname_assignment-title.zip`
- Add and edit **teacher feedback** visible to students
- Download files and open GitHub links
- Search students by username

### Student
- Register with **email verification (OTP)**, username, and password
- **Account settings** — change email or password with OTP confirmation
- Dashboard and **card-based** assignment list with status filters
- **Preview** assignment PDF in browser before downloading
- Download assignment PDFs with clean filenames (assignment title)
- Submit ZIP, individual files, folder uploads, or GitHub URL
- Update submission before deadline
- View submission history and **teacher feedback**

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React, Vite, Tailwind CSS, Axios, React Router |
| Backend | Node.js, Express |
| Database | PostgreSQL (Neon / Supabase / Docker) |
| Auth | JWT + bcrypt |
| Storage | Local filesystem (dev) / Supabase Storage (production) |

## Project Structure

```
assignment-portal/
├── backend/          # Express REST API
├── frontend/         # React SPA
├── database/         # PostgreSQL schema
├── docs/             # Study documentation
├── docker-compose.yml
└── README.md
```

📖 **Full study guide:** [docs/PROJECT_DOCUMENTATION.md](docs/PROJECT_DOCUMENTATION.md) — architecture, API reference, frontend-backend integration, and data flows.

🚀 **Deploy free (teacher + students):** [docs/FREE_DEPLOYMENT_GUIDE.md](docs/FREE_DEPLOYMENT_GUIDE.md) — Vercel + Render + Neon step-by-step.

## Quick Start (Local)

### Prerequisites
- Node.js 18+
- Docker (for local PostgreSQL) **or** a Neon/Supabase connection string

### 1. Database

**Option A — Local SQLite (zero setup, default)**

The backend uses embedded SQLite when `USE_SQLITE=true` (default in `.env.example`). No Docker required.

**Option B — PostgreSQL (production)**

```bash
docker compose up -d
```

Or use a free [Neon](https://neon.tech) database. Set `USE_SQLITE=false` and provide `DATABASE_URL`.

### 2. Backend

```bash
cd backend
cp .env.example .env
npm install
npm run db:seed    # creates default teacher account
npm run dev
```

API runs at **http://localhost:8000**

Default teacher login:
- **Username:** `teacher`
- **Password:** `teacher123`

### 3. Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

App runs at **http://localhost:5173**

**Same WiFi testing:** With `host: true` in Vite, open the **Network** URL shown in the terminal (e.g. `http://192.168.x.x:5173`) on a phone or another laptop on the same WiFi.

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret for signing JWT tokens |
| `FRONTEND_URL` | Frontend origin for CORS |
| `MAX_FILE_SIZE_MB` | Max upload size (default 200) |
| `TEACHER_USERNAME` | Seed teacher username |
| `TEACHER_PASSWORD` | Seed teacher password |
| `SMTP_HOST` | SMTP server (default `smtp-relay.brevo.com` for Brevo) |
| `SMTP_PORT` | SMTP port (default `587`) |
| `SMTP_USER` | Brevo **SMTP login** from dashboard (format `xxx@smtp-brevo.com`) — not your Gmail |
| `SMTP_PASS` | Brevo SMTP key (from SMTP & API in dashboard) |
| `EMAIL_FROM` | Verified sender, e.g. `Terralogic ASP <your-email@gmail.com>` |

### Frontend (`frontend/.env`)

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend API base URL (use `/api` locally with Vite proxy) |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/otp/send/register` | Send registration OTP to email |
| POST | `/api/auth/register` | Student registration (email + OTP) |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Current user |
| GET | `/api/assignments` | List assignments |
| POST | `/api/assignments` | Create assignment (teacher) |
| GET | `/api/submissions` | List submissions |
| PATCH | `/api/submissions/:id/feedback` | Teacher feedback on submission |
| POST | `/api/submissions/assignment/:id` | Submit work (student) |
| GET | `/api/files/assignments/:filename` | Download/preview assignment PDF |
| GET | `/api/files/submissions/:filename` | Download/preview submission file |
| GET | `/api/dashboard/teacher` | Teacher stats |
| GET | `/api/dashboard/student` | Student stats |

Full interactive docs available at `/api/health`.

## Deployment

### Frontend — Vercel
1. Import the `frontend` folder
2. Set `VITE_API_URL` to your deployed API URL
3. Deploy

### Backend — Render
1. Create a Web Service from the `backend` folder
2. Build: `npm install`
3. Start: `npm start`
4. Add env vars: `DATABASE_URL`, `JWT_SECRET`, `FRONTEND_URL`

### Database — Neon
1. Create a free PostgreSQL project at [neon.tech](https://neon.tech)
2. Run `database/schema.sql` in the SQL editor
3. Set `DATABASE_URL` on Render

### Storage
Production uses **Supabase Storage** (`STORAGE_TYPE=supabase`). See [docs/FREE_DEPLOYMENT_GUIDE.md](docs/FREE_DEPLOYMENT_GUIDE.md).

## Security Notes
- Change `JWT_SECRET` and teacher password in production
- Use HTTPS in production
- File uploads are validated by extension and MIME type
- Students cannot view other students' submissions

## Future Enhancements
- Email notifications and deadline reminders
- GitHub integration and auto-clone
- Grading rubrics and leaderboard
- Batch management and announcements

## License

MIT

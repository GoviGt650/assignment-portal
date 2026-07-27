# Terralogic Assignment Portal

A centralized **Assignment Submission Portal (ASP)** for teachers and students. Replace WhatsApp PDF sharing and manual Git tracking with a single web app for publishing assignments, submitting work, and tracking submissions.

## Features

### Teacher
- Secure login
- Upload assignment PDFs with title, description, and deadline
- View, edit, and delete assignments
- Dashboard with stats (students, assignments, submissions)
- View and search student submissions
- Download submitted files and open GitHub links
- Mark submission status (submitted, reviewed, late, pending)
- Search students by username

### Student
- Register with username and password
- View active, pending, and completed assignments
- Download assignment PDFs
- Submit ZIP, individual files, folder uploads, or GitHub URL
- Update submission before deadline
- View submission history and teacher remarks

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React, Vite, Tailwind CSS, Axios, React Router |
| Backend | Node.js, Express |
| Database | PostgreSQL (Neon / Supabase / Docker) |
| Auth | JWT + bcrypt |
| Storage | Local filesystem (dev) — Cloudinary/Supabase ready |

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

### Frontend (`frontend/.env`)

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend API base URL (e.g. `http://localhost:8000/api`) |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Student registration |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Current user |
| GET | `/api/assignments` | List assignments |
| POST | `/api/assignments` | Create assignment (teacher) |
| GET | `/api/submissions` | List submissions |
| POST | `/api/submissions/assignment/:id` | Submit work (student) |
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
For production, replace `backend/src/services/storageService.js` with Cloudinary or Supabase Storage integration.

## Security Notes
- Change `JWT_SECRET` and teacher password in production
- Use HTTPS in production
- File uploads are validated by extension and MIME type
- Students cannot view other students' submissions

## Future Enhancements
- Email notifications and deadline reminders
- GitHub integration and auto-clone
- Grading, feedback, and leaderboard
- Batch management and announcements

## License

MIT

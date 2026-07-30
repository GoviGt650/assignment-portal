# Academy Assignment Portal — Project Documentation

> **Purpose of this document:** A complete study guide for understanding how this full-stack project is built, how the frontend and backend connect, how API calls work, and how data flows through the system.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture](#2-architecture)
3. [Tech Stack](#3-tech-stack)
4. [Project Structure](#4-project-structure)
5. [Database Design](#5-database-design)
6. [Backend — How It Works](#6-backend--how-it-works)
7. [Frontend — How It Works](#7-frontend--how-it-works)
8. [Frontend ↔ Backend Integration](#8-frontend--backend-integration)
9. [Authentication & JWT Flow](#9-authentication--jwt-flow)
10. [Complete API Reference](#10-complete-api-reference)
11. [Real-World Request Flows](#11-real-world-request-flows)
12. [File Upload System](#12-file-upload-system)
13. [Student Status Logic](#13-student-status-logic)
14. [Environment Variables](#14-environment-variables)
15. [Running Locally](#15-running-locally)
16. [Deployment Overview](#16-deployment-overview)
17. [Study Checklist](#17-study-checklist)
18. [UI Components & UX Features](#18-ui-components--ux-features)

---

## 1. Project Overview

### Problem
Assignments were shared on WhatsApp as PDFs. Students downloaded files, pushed code to Git, and submitted manually. Teachers had no central way to track submissions.

### Solution
**Academy Assignment Portal (ASP)** is a web application with two roles:

| Role | Can Do |
|------|--------|
| **Teacher** | Upload assignments (PDF + date deadline), manage assignments, review submissions with filters, preview/download files, set colored status, add feedback, manage profile |
| **Student** | Register, browse assignments, preview/download PDFs, submit work, view history and teacher feedback |

### High-Level Flow

```
Teacher uploads assignment → Student sees it on dashboard → Student submits work
→ Teacher reviews submission → Teacher updates status and adds feedback → Student reads feedback
```

---

## 2. Architecture

This project follows a **client–server architecture** with a **REST API**:

```
┌─────────────────────────────────────────────────────────────────┐
│                        BROWSER (Client)                          │
│  React SPA (Vite) — pages, components, routing, UI state        │
│       │                                                          │
│       │  Axios HTTP requests (JSON + multipart/form-data)        │
│       ▼                                                          │
│  frontend/src/services/api.js  ← single API layer               │
└──────────────────────────┬──────────────────────────────────────┘
                           │
              HTTP  (localhost:5173 → proxy → :8000)
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│                     BACKEND (Server)                               │
│  Express.js — routers, middleware, business logic                  │
│       │                                                          │
│       ├── JWT auth middleware                                    │
│       ├── SQL queries (pg / sql.js)                              │
│       └── File storage (local dev / Supabase in production)      │
└──────────────────────────┬──────────────────────────────────────┘
                           │
              ┌────────────┴────────────┐
              ▼                         ▼
     SQLite (local dev)          PostgreSQL (production)
     backend/data/*.db           Neon / Supabase
```

### Why separate frontend and backend?

| Benefit | Explanation |
|---------|-------------|
| **Separation of concerns** | UI logic stays in React; business rules stay in Express |
| **Reusable API** | Same API could power a mobile app later |
| **Independent deployment** | Frontend on Vercel, backend on Render |
| **Security** | Database and secrets never exposed to the browser |

---

## 3. Tech Stack

### Frontend (`frontend/`)

| Technology | Purpose |
|------------|---------|
| **React 19** | UI components and page rendering |
| **Vite** | Fast dev server and production build tool |
| **Tailwind CSS v4** | Utility-first styling |
| **React Router v7** | Client-side routing (`/login`, `/teacher`, `/student`) |
| **Axios** | HTTP client for API calls |
| **react-hot-toast** | Toast notifications for success/error |
| **lucide-react** | Icons |

### Backend (`backend/`)

| Technology | Purpose |
|------------|---------|
| **Node.js + Express** | REST API server |
| **JWT (jsonwebtoken)** | Stateless authentication tokens |
| **bcryptjs** | Password hashing (never store plain passwords) |
| **express-validator** | Request body validation |
| **multer** | Multipart file upload handling |
| **archiver** | Zip folder uploads into a single file |
| **pg** | PostgreSQL driver (production) |
| **sql.js** | SQLite in-memory/file DB (local dev) |

### Database

| Environment | Engine | Config |
|-------------|--------|--------|
| Local dev | SQLite via `sql.js` | `USE_SQLITE=true` in `.env` |
| Production | PostgreSQL | `USE_SQLITE=false` + `DATABASE_URL` |

Schema file: `database/schema.sql`

---

## 4. Project Structure

```
AssignmentSubmitter/
│
├── frontend/                    # React single-page application
│   ├── src/
│   │   ├── main.jsx             # App entry point
│   │   ├── App.jsx              # Route definitions
│   │   ├── context/
│   │   │   └── AuthContext.jsx  # Global login state + JWT storage
│   │   ├── services/
│   │   │   └── api.js           # ★ ALL backend API calls live here
│   │   ├── layouts/
│   │   │   └── DashboardLayout.jsx  # Sidebar + outlet for dashboards
│   │   ├── components/          # Reusable UI (badges, tables, spinners)
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   ├── student/         # Student-only pages
│   │   │   └── teacher/         # Teacher-only pages
│   │   └── utils/helpers.js     # Date formatting, status helpers
│   ├── vite.config.js           # Dev proxy: /api → localhost:8000
│   └── .env                     # VITE_API_URL=http://localhost:8000/api
│
├── backend/                     # Express REST API
│   ├── src/
│   │   ├── index.js             # Server entry — mounts routers
│   │   ├── config.js            # Reads .env variables
│   │   ├── db.js                # DB adapter (SQLite or PostgreSQL)
│   │   ├── routers/             # ★ Route handlers grouped by feature
│   │   │   ├── auth.js
│   │   │   ├── assignments.js
│   │   │   ├── submissions.js
│   │   │   ├── dashboard.js
│   │   │   └── files.js
│   │   ├── middleware/
│   │   │   ├── auth.js          # JWT verify + role check
│   │   │   ├── upload.js        # Multer file upload config
│   │   │   └── errors.js        # Central error handler
│   │   ├── services/
│   │   │   ├── authService.js   # hashPassword, createToken, verifyToken
│   │   │   └── storageService.js # Save/delete uploaded files
│   │   └── utils/
│   │       └── studentStatus.js # Unified status calculation
│   ├── uploads/                 # Stored PDFs and submission files
│   └── .env                     # Secrets and config
│
├── database/
│   └── schema.sql               # PostgreSQL schema (production)
│
└── docs/
    └── PROJECT_DOCUMENTATION.md # This file
```

---

## 5. Database Design

### Entity Relationship

```
users (1) ──────< assignments (created_by)
  │
  └──────< submissions (student_id)
              │
              └──> assignments (assignment_id)
```

### Tables

#### `users`
| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| username | VARCHAR(50) | Unique login name |
| password | VARCHAR(255) | bcrypt hash (never plain text) |
| role | ENUM | `teacher` or `student` |
| created_at | TIMESTAMP | Registration time |

#### `assignments`
| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| title | VARCHAR(200) | Assignment name |
| description | TEXT | Instructions |
| pdf_url | TEXT | Path to uploaded PDF |
| deadline | TIMESTAMP | Due date/time |
| created_by | FK → users | Teacher who created it |
| created_at | TIMESTAMP | Publish time |

#### `submissions`
| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| assignment_id | FK → assignments | Which assignment |
| student_id | FK → users | Who submitted |
| github_url | TEXT | Optional GitHub repo link |
| uploaded_file | TEXT | Path to ZIP/file |
| submitted_at | TIMESTAMP | Submission time |
| status | ENUM | `pending`, `submitted`, `reviewed`, `late` |
| remarks | TEXT | Teacher feedback |

**Unique constraint:** One submission per student per assignment (`assignment_id + student_id`).

---

## 6. Backend — How It Works

### Server bootstrap (`backend/src/index.js`)

1. Load environment variables from `.env`
2. Enable **CORS** — only allows requests from `FRONTEND_URL`
3. Parse JSON request bodies
4. Initialize upload folders
5. Mount route groups under `/api/*`
6. Register global error handler

```javascript
app.use('/api/auth', authRouter);
app.use('/api/assignments', assignmentsRouter);
app.use('/api/submissions', submissionsRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/files', filesRouter);
```

### Router pattern

Each router file follows the same pattern:

```
Request → authenticate middleware → requireRole (if needed) → validation → SQL query → JSON response
```

Example from `assignments.js`:

```javascript
router.post('/', authenticate, requireRole('teacher'), uploadPdf, async (req, res) => {
  // 1. Validate title, deadline
  // 2. Save PDF via storageService
  // 3. INSERT into assignments table
  // 4. Return created assignment
});
```

### Middleware chain

| Middleware | File | What it does |
|------------|------|--------------|
| `authenticate` | `middleware/auth.js` | Reads `Authorization: Bearer <token>`, verifies JWT, sets `req.user` |
| `requireRole('teacher')` | `middleware/auth.js` | Blocks request if role doesn't match |
| `uploadPdf` / `uploadSubmission` | `middleware/upload.js` | Multer saves file to temp, validates type/size |
| `errorHandler` | `middleware/errors.js` | Catches all errors, returns `{ detail: "message" }` |

### Database adapter (`backend/src/db.js`)

Automatically picks the database engine:

```javascript
// If USE_SQLITE=true OR no DATABASE_URL → use sql.js (local file)
// Otherwise → use PostgreSQL via pg pool
```

Both expose the same `query(sql, params)` function so routers don't care which DB is used.

---

## 7. Frontend — How It Works

### Entry and routing

```
main.jsx
  └── AuthProvider (wraps entire app with login state)
        └── BrowserRouter
              └── Routes in App.jsx
```

### Route map

| Path | Who | Page |
|------|-----|------|
| `/login` | Public | LoginPage |
| `/register` | Public | RegisterPage |
| `/student` | Student | StudentDashboard |
| `/student/assignments` | Student | Assignment list |
| `/student/assignments/:id` | Student | Assignment detail |
| `/student/assignments/:id/submit` | Student | Submit form |
| `/student/history` | Student | Submission history |
| `/teacher` | Teacher | TeacherDashboard |
| `/teacher/assignments` | Teacher | Manage assignments |
| `/teacher/upload` | Teacher | Upload form |
| `/teacher/submissions` | Teacher | Review submissions |
| `/teacher/students` | Teacher | Student list |
| `/teacher/profile` | Teacher | Account settings (email, username, password via OTP) |
| `/teacher/setup-email` | Teacher | First-time email setup (required if no email on account) |

### Protected routes (`components/ProtectedRoute.jsx`)

```javascript
// If not logged in → redirect to /login
// If wrong role → redirect to correct dashboard
<ProtectedRoute role="teacher">
  <DashboardLayout />
</ProtectedRoute>
```

### Global auth state (`context/AuthContext.jsx`)

| Function | What it does |
|----------|--------------|
| `login()` | POST `/auth/login` → save token in `localStorage` → set user state |
| `register()` | POST `/auth/register` → auto-login |
| `logout()` | Remove token, clear user |
| `updateSession()` | After profile change → save new token + user |

On app load, if a token exists in `localStorage`, it calls `GET /auth/me` to restore the session.

### Shared UI components (`components/UI.jsx`)

Reusable building blocks used across teacher and student pages:

| Component | Purpose |
|-----------|---------|
| `NoticeCard` | Info/success/warning/error banners with optional dismiss |
| `FilePicker` | Drag-and-drop file input with validation hints |
| `DatePickerField` | Date-only deadline picker (uses `showPicker()` on Windows) |
| `ConfirmDialog` | Modal confirmation for destructive actions |
| `IconBox` | Consistent icon container styling |
| `FilterBar` | Search + filter controls for list pages |
| `UserAvatar` | Initials-based avatar for usernames |
| `StatusSelect` | Colored status dropdown (pending, submitted, reviewed, late) |
| `FilePreviewModal` | Inline preview for PDF, images, and text; download prompt for ZIP/other |

### Helper utilities (`utils/helpers.js`)

| Function | Purpose |
|----------|---------|
| `dateInputToDeadlineISO()` | Converts date input to end-of-day ISO deadline |
| `statusSelectClass()` | Tailwind classes per submission status |
| `buildSubmissionDownloadName()` | Builds `{student}_{assignment-title}.{ext}` download names |

---

## 8. Frontend ↔ Backend Integration

### Step 1 — Environment variable

**Frontend** `.env`:
```
VITE_API_URL=/api
```

Using `/api` with the Vite proxy avoids CORS issues in development. For production, set the full backend URL (e.g. `https://your-api.onrender.com/api`).

**Backend** `.env`:
```
FRONTEND_URL=http://localhost:5173
PORT=8000
```

### Step 2 — Vite dev proxy

During development, Vite proxies API calls so the browser doesn't hit CORS issues:

```javascript
// frontend/vite.config.js
server: {
  host: true,   // exposes Network URL for same-WiFi testing
  proxy: {
    '/api': { target: 'http://localhost:8000' }
  }
}
```

So when frontend calls `/api/auth/login`, Vite forwards it to `http://localhost:8000/api/auth/login`.

**Same-WiFi testing:** After `npm run dev`, Vite prints a **Network** URL (e.g. `http://192.168.x.x:5173`). Open it on a phone or another laptop on the same WiFi. The backend listens on `0.0.0.0` and allows local-network origins in development.

### Step 3 — Axios client (`frontend/src/services/api.js`)

One centralized API module — **every page imports from here**, never calls `fetch` directly (except file downloads).

```javascript
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,  // http://localhost:8000/api
});

// Attach JWT to EVERY request automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
```

### Step 4 — API modules

```javascript
export const authApi = { login, register, me, updateProfile, getStudents };
export const assignmentApi = { list, get, create, update, remove };
export const submissionApi = { list, submit, submitFiles, history, updateStatus, updateFeedback };
export const dashboardApi = { teacher, student };
```

File helpers also exported from `api.js`:

```javascript
resolveFileUrl(url)    // prepends API base for relative file paths
fetchFileBlob(url)     // authenticated blob fetch for preview/download
downloadFile(url, name) // triggers named browser download
```

### Step 5 — Page calls API

Example from `StudentDashboard.jsx`:

```javascript
useEffect(() => {
  dashboardApi.student()
    .then(({ data }) => setData(data))
    .finally(() => setLoading(false));
}, []);
```

This sends:
```
GET http://localhost:8000/api/dashboard/student
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

### Connection diagram

```
LoginPage.jsx
    │
    │  authApi.login({ username, password })
    ▼
api.js  ──POST /auth/login──▶  auth.js router
    │                              │
    │                              ▼
    │                         Verify password (bcrypt)
    │                         Create JWT token
    │                              │
    ◀── { access_token, user } ───┘
    │
    ▼
localStorage.setItem('token', ...)
AuthContext.setUser(user)
navigate('/teacher' or '/student')
```

---

## 9. Authentication & JWT Flow

### Registration (Student only)

```
POST /api/auth/register
Body: { "username": "john", "password": "pass123" }

Backend:
  1. Check username not taken
  2. Hash password with bcrypt (12 rounds)
  3. INSERT user with role = 'student'
  4. Create JWT → return token + user
```

### Login

```
POST /api/auth/login
Body: { "username": "teacher", "password": "teacher123" }

Backend:
  1. Find user by username
  2. bcrypt.compare(password, storedHash)
  3. Create JWT with payload: { sub: userId, username, role }
  4. Return { access_token, user }
```

### JWT token structure

```json
{
  "sub": 1,
  "username": "teacher",
  "role": "teacher",
  "iat": 1785084572,
  "exp": 1785689372
}
```

Signed with `JWT_SECRET`. Expires in 7 days (`JWT_EXPIRES_IN=7d`).

### Protected request flow

```
Browser sends:  Authorization: Bearer <token>
                      │
                      ▼
         authenticate middleware
                      │
         jwt.verify(token, JWT_SECRET)
                      │
         req.user = { sub, username, role }
                      │
                      ▼
              Route handler runs
```

### Teacher account

Created by seed script, not public registration:

```bash
cd backend
npm run db:seed
# Creates: teacher / teacher123 (from .env)
```

---

## 10. Complete API Reference

Base URL: `http://localhost:8000/api`

All protected routes require header:
```
Authorization: Bearer <your_jwt_token>
```

---

### Health

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/health` | No | Check if API is running |

**Response:**
```json
{ "status": "ok", "service": "Assignment Submission Portal API" }
```

---

### Auth (`/api/auth`)

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| POST | `/otp/send/register` | No | — | Send registration OTP |
| POST | `/register` | No | — | Student registration (email + OTP) |
| POST | `/login` | No | — | Login (teacher or student) |
| GET | `/me` | Yes | Any | Get current user profile |
| POST | `/otp/send/setup-email` | Yes | Teacher | Send OTP to new email (first-time setup) |
| PATCH | `/account/setup-email` | Yes | Teacher | Add email: `{ email, otp, current_password }` |
| POST | `/otp/send/change-email` | Yes | Student, Teacher | OTP to new email |
| POST | `/otp/send/change-password` | Yes | Student, Teacher | OTP to registered email |
| POST | `/otp/send/change-username` | Yes | Teacher | OTP to registered email |
| PATCH | `/account/email` | Yes | Student, Teacher | Update email with OTP |
| PATCH | `/account/password` | Yes | Student, Teacher | Update password with OTP |
| PATCH | `/account/username` | Yes | Teacher | Update username with OTP |
| POST | `/forgot-password/lookup` | No | — | Lookup by email or username (masked email if found) |
| POST | `/otp/send/forgot-password` | No | — | Send reset OTP (any user with registered email) |
| POST | `/reset-password` | No | — | Reset password with OTP |
| PATCH | `/profile` | Yes | Teacher | Legacy username/password change with current password |
| GET | `/students` | Yes | Teacher | List/search students |

**POST /login — Request:**
```json
{ "username": "teacher", "password": "teacher123" }
```

**POST /login — Response:**
```json
{
  "access_token": "eyJhbG...",
  "token_type": "bearer",
  "user": { "id": 1, "username": "teacher", "role": "teacher", "created_at": "..." }
}
```

**PATCH /profile — Request:**
```json
{
  "current_password": "teacher123",
  "new_username": "admin",
  "new_password": "newpass456",
  "confirm_password": "newpass456"
}
```

---

### Assignments (`/api/assignments`)

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/` | Yes | Any | List assignments (with filters) |
| GET | `/:id` | Yes | Any | Get single assignment |
| POST | `/` | Yes | Teacher | Create assignment + PDF |
| PUT | `/:id` | Yes | Teacher | Update assignment |
| DELETE | `/:id` | Yes | Teacher | Delete assignment |

**GET / — Query params (students):**
```
?page=1&limit=10&status=pending|active|completed|all
```

**POST / — multipart/form-data:**
```
title: "Week 1 Assignment"
description: "Build a todo app"
deadline: "2026-08-01T23:59:00.000Z"
pdf: (file)
```

---

### Submissions (`/api/submissions`)

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/` | Yes | Any | List submissions (filtered) |
| GET | `/history` | Yes | Student | Own submission history |
| GET | `/:id` | Yes | Any | Single submission detail |
| POST | `/assignment/:assignmentId` | Yes | Student | Submit file or GitHub URL |
| POST | `/assignment/:assignmentId/files` | Yes | Student | Submit multiple files (folder) |
| PATCH | `/:id/status` | Yes | Teacher | Update status + remarks |
| PATCH | `/:id/feedback` | Yes | Teacher | Add or update teacher feedback |
| GET | `/export/all` | Yes | Teacher | Export all submissions |

**POST /assignment/:id — multipart/form-data:**
```
file: (zip or any allowed file)
github_url: "https://github.com/user/repo"  (optional)
```

**PATCH /:id/status — Request:**
```json
{ "status": "reviewed", "remarks": "Good work!" }
```

**PATCH /:id/feedback — Request:**
```json
{ "feedback": "Nice structure. Add error handling for edge cases." }
```

Feedback is stored in the `remarks` column and shown to the student on assignment detail and submission history pages.

Status values: `pending`, `submitted`, `reviewed`, `late`

**GET / — Query params (teacher):**
```
?search=john&status=submitted&assignment_id=3
```

---

### Dashboard (`/api/dashboard`)

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/teacher` | Yes | Teacher | Stats + recent activity |
| GET | `/student` | Yes | Student | Stats + recent assignments |

**GET /student — Response:**
```json
{
  "active_assignments": 3,
  "completed_assignments": 2,
  "pending_assignments": 1,
  "overdue_assignments": 0,
  "recent_assignments": [ ... ]
}
```

---

### Files (`/api/files`)

**Architecture (always use this pattern):**

```
Browser  →  GET /api/files/... + JWT  →  Render API  →  Supabase / disk  →  file bytes
```

The frontend **never** talks to Supabase or disk directly. The database stores relative paths like `/api/files/assignments/1730-homework.pdf`. Preview and download both go through the backend with the user's JWT.

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/assignments/:filename` | Yes | Stream assignment PDF from storage |
| GET | `/submissions/:filename` | Yes | Stream student submission from storage |

**Frontend:** `resolveFileUrl()` turns DB paths into the full Render URL in production (`VITE_API_URL` must be set on Vercel, e.g. `https://your-api.onrender.com/api`). `fetchFileBlob()` and `downloadFile()` attach `Authorization: Bearer <token>`.

**Backend:** `files.js` → `streamFile()` → Supabase bucket (production) or local `uploads/` (dev). Logs: `[files]`, `[storage]`.

**Production env (Render):** `STORAGE_TYPE=supabase`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.

**Production env (Vercel):** `VITE_API_URL=https://your-api.onrender.com/api` — required so file requests hit Render, not the Vercel SPA.

---

## 11. Real-World Request Flows

### Flow A — Teacher uploads an assignment

```
1. Teacher fills form on /teacher/upload (date-only deadline picker)
2. Frontend converts date to end-of-day ISO via `dateInputToDeadlineISO()`
3. Frontend builds FormData with title, description, deadline, pdf file
4. assignmentApi.create(formData)
   → POST /api/assignments  (multipart)
5. Backend: multer saves PDF via storage service
6. Backend: INSERT row in assignments table
7. Frontend: toast "Assignment published!" → navigate to /teacher/assignments
```

### Flow B — Student submits work

```
1. Student opens /student/assignments/1/submit
2. Selects ZIP file OR enters GitHub URL
3. submissionApi.submit(1, formData)
   → POST /api/submissions/assignment/1  (multipart)
4. Backend checks deadline not passed
5. Backend saves file to uploads/submissions/
6. Backend INSERT or UPDATE submissions row
7. Status computed: 'submitted' or 'late' based on deadline
8. Frontend: toast success → navigate to assignment detail
9. Assignment detail shows student_status = 'submitted'
```

### Flow C — Teacher reviews submission

```
1. Teacher opens /teacher/submissions (optional ?assignment_id= filter)
2. submissionApi.list({ search, status, assignment_id })
   → GET /api/submissions?search=john&status=submitted&assignment_id=3
3. Teacher previews file (eye icon) → FilePreviewModal opens inline
4. Teacher downloads with name like john_week-1-assignment.zip
5. Teacher clicks status dropdown → 'reviewed' (colored StatusSelect)
6. Teacher opens feedback modal → submissionApi.updateFeedback(id, { feedback })
   → PATCH /api/submissions/5/feedback
7. Student sees 'Reviewed' badge and feedback on assignment detail / history
```

### Flow D — Login and session restore

```
App load:
  localStorage has token?
    YES → GET /api/auth/me → set user in AuthContext
    NO  → show login page

Login:
  POST /api/auth/login → save token → redirect by role
    teacher → /teacher
    student → /student
```

---

## 12. File Upload System

### How uploads work

```
Browser (FormData)
      │
      ▼
Multer middleware (middleware/upload.js)
  - Validates file type and size (max 200 MB)
  - Saves to uploads/temp/ temporarily
      │
      ▼
storageService.saveFile(type, file)
  - Moves file to uploads/assignments/ or uploads/submissions/
  - Returns public URL: /api/files/assignments/1234-filename.pdf
      │
      ▼
URL stored in database (pdf_url or uploaded_file column)
```

### Downloading and previewing files

All file access goes through the backend API (JWT required). Never fetch Supabase URLs from the browser.

```javascript
// resolveFileUrl('/api/files/...') → full Render URL in production
// fetchFileBlob(url) → GET + Bearer token → blob for preview
// downloadFile(url, filename) → same fetch, then browser download
```

Assignment PDFs download with the assignment title as filename. Files require authentication — students cannot access other students' submissions.

### Storage backends

| Environment | Backend | Path |
|-------------|---------|------|
| Local dev | `storage/local.js` | `uploads/assignments/`, `uploads/submissions/` |
| Production | `storage/supabase.js` | Supabase Storage buckets |

Set `STORAGE_TYPE=supabase` with `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` for production. See [FREE_DEPLOYMENT_GUIDE.md](FREE_DEPLOYMENT_GUIDE.md).

### Folder upload (student)

When student selects a folder:
1. Browser sends multiple files to `POST /submissions/assignment/:id/files`
2. Backend uses **archiver** to zip all files server-side
3. Single ZIP stored in `uploads/submissions/`

---

## 13. Student Status Logic

Defined in `backend/src/utils/studentStatus.js` and mirrored in `frontend/src/utils/helpers.js`.

| Status | Meaning |
|--------|---------|
| `pending` | Not submitted, deadline not passed |
| `overdue` | Not submitted, deadline passed |
| `submitted` | Submitted on time |
| `late` | Submitted after deadline |
| `reviewed` | Teacher marked as reviewed |

Every assignment API response for students includes `student_status` and `my_submission`.

---

## 14. Environment Variables

### Backend (`backend/.env`)

| Variable | Example | Purpose |
|----------|---------|---------|
| `USE_SQLITE` | `true` | Use local SQLite instead of PostgreSQL |
| `PORT` | `8000` | API server port |
| `NODE_ENV` | `development` | Environment mode |
| `DATABASE_URL` | `postgresql://...` | PostgreSQL connection (production) |
| `JWT_SECRET` | `long-random-string` | Signs JWT tokens |
| `JWT_EXPIRES_IN` | `7d` | Token lifetime |
| `FRONTEND_URL` | `http://localhost:5173` | CORS allowed origin |
| `MAX_FILE_SIZE_MB` | `200` | Upload size limit |
| `TEACHER_USERNAME` | `teacher` | Default teacher login |
| `TEACHER_PASSWORD` | `teacher123` | Default teacher password |

### Frontend (`frontend/.env`)

| Variable | Example | Purpose |
|----------|---------|---------|
| `VITE_API_URL` | `/api` | Backend API base URL (use `/api` locally with Vite proxy) |

> **Note:** Only variables prefixed with `VITE_` are exposed to the React app.

---

## 15. Running Locally

### Terminal 1 — Backend
```bash
cd backend
npm install
npm run db:seed        # create teacher account (first time only)
npm run dev            # starts on http://localhost:8000
```

### Terminal 2 — Frontend
```bash
cd frontend
npm install
npm run dev            # starts on http://localhost:5173
```

**Same WiFi:** Use the **Network** URL from the Vite terminal output to test on other devices.

### Default login
- **Teacher:** `teacher` / `teacher123`
- **Student:** register at `/register`

### Useful backend scripts

| Command | Purpose |
|---------|---------|
| `npm run db:seed` | Create teacher account if missing |
| `npm run db:reset-teacher` | Reset teacher password to `.env` value |
| `npm run db:init` | Apply PostgreSQL schema (production DB) |

---

## 16. Deployment Overview

| Component | Platform | Free Tier |
|-----------|----------|-----------|
| Frontend | Vercel | Yes |
| Backend | Render | Yes (cold starts) |
| Database | Neon PostgreSQL | Yes |
| File storage | Supabase Storage | Yes (1 GB) |

### Production changes required

1. Set `USE_SQLITE=false` on backend
2. Set `DATABASE_URL` to Neon connection string
3. Run `database/schema.sql` on Neon
4. Set `STORAGE_TYPE=supabase` with Supabase credentials
5. Set `VITE_API_URL=https://your-api.onrender.com/api` on Vercel
6. Set `FRONTEND_URL=https://your-app.vercel.app` on Render
7. Change `JWT_SECRET` and `TEACHER_PASSWORD`

> Full step-by-step instructions: [FREE_DEPLOYMENT_GUIDE.md](FREE_DEPLOYMENT_GUIDE.md)

---

## 17. Study Checklist

Use this checklist to verify you understand the project:

- [ ] I can explain why frontend and backend are separate
- [ ] I know where all API calls are defined (`frontend/src/services/api.js`)
- [ ] I understand how JWT is stored and attached to requests
- [ ] I can trace a login request from `LoginPage` → backend → database
- [ ] I know the three database tables and their relationships
- [ ] I understand how `authenticate` and `requireRole` middleware work
- [ ] I can explain how file uploads flow through Multer → storageService
- [ ] I know the difference between `submitted`, `reviewed`, and `late` status
- [ ] I understand how Vite proxy connects frontend to backend in dev
- [ ] I can list all API endpoints and which role can access each
- [ ] I understand how teacher feedback flows from PATCH /feedback to student UI
- [ ] I know how FilePreviewModal decides preview vs download-only
- [ ] I can explain date-only deadlines and `dateInputToDeadlineISO()`

---

## 18. UI Components & UX Features

### Teacher experience

| Page | Notable UX |
|------|------------|
| `UploadAssignment.jsx` | Sectioned layout, date picker, PDF preview sidebar |
| `ManageAssignments.jsx` | Card grid with submission counts and stats |
| `SubmissionList.jsx` | Compact table, assignment filter, search, status filter, preview + feedback |
| `TeacherProfile.jsx` | Profile / Security tabs, username and password change |

### Student experience

| Page | Notable UX |
|------|------------|
| `StudentDashboard.jsx` | Stats cards and recent assignments |
| `StudentAssignments.jsx` | Card-based assignment list with status filters |
| `AssignmentDetail.jsx` | Sidebar layout, PDF preview button, feedback display |
| `SubmissionHistory.jsx` | History list with teacher feedback |
| `SubmitAssignment.jsx` | File picker, GitHub URL, folder upload |

### Status colors

The `StatusSelect` component applies distinct colors per status via `statusSelectClass()` in `helpers.js`, making submission state scannable at a glance.

### Named downloads

Downloads use human-readable names instead of server-generated UUID filenames:

- Submissions: `{username}_{assignment-title}.{ext}`
- Assignment PDFs: assignment title

---

## Quick Reference — File to Feature Map

| Feature | Frontend File | Backend File |
|---------|--------------|--------------|
| Login | `pages/LoginPage.jsx` | `routers/auth.js` |
| Register (3-step) | `pages/RegisterPage.jsx` | `routers/auth.js` |
| Forgot password (3-step) | `pages/ForgotPasswordPage.jsx` | `routers/auth.js` |
| Teacher email setup | `pages/teacher/TeacherSetupEmail.jsx` | `routers/auth.js` (setup-email) |
| Teacher email gate | `layouts/TeacherLayout.jsx` | redirects to `/teacher/setup-email` if no email |
| Teacher account settings | `pages/teacher/TeacherProfile.jsx` | OTP routes + `/account/*` |
| Student account settings | `pages/student/StudentProfile.jsx` | OTP routes + `/account/*` |
| Step progress UI | `components/AuthStepIndicator.jsx` | used on register, forgot password, teacher setup |
| Teacher dashboard | `pages/teacher/TeacherDashboard.jsx` | `routers/dashboard.js` |
| Upload assignment | `pages/teacher/UploadAssignment.jsx` | `routers/assignments.js` |
| Submit work | `pages/student/SubmitAssignment.jsx` | `routers/submissions.js` |
| Teacher feedback | `pages/teacher/SubmissionList.jsx` | `routers/submissions.js` (PATCH /feedback) |
| File preview | `components/UI.jsx` (FilePreviewModal) | `routers/files.js` + storage services |
| Change password | `pages/teacher/TeacherProfile.jsx` | `routers/auth.js` (PATCH /account/password) |
| Download/preview PDF | `pages/student/AssignmentDetail.jsx` | `routers/files.js` |
| Shared UI | `components/UI.jsx` | — |
| Helpers (dates, names) | `utils/helpers.js` | — |
| Auth state | `context/AuthContext.jsx` | `middleware/auth.js` |
| All API calls | `services/api.js` | all routers |

---

## 19. Email OTP, Notifications & Collaboration (v1.3)

### Email OTP (Brevo SMTP)

Students verify email during registration. Teachers add a recovery email on first login. OTP codes expire in **10 minutes** with a **60s resend cooldown**.

| Purpose | Endpoint | Who |
|---------|----------|-----|
| Registration | `POST /api/auth/otp/send/register` | Public |
| Teacher setup email | `POST /api/auth/otp/send/setup-email` | Teacher (no email yet) |
| Teacher add email | `PATCH /api/auth/account/setup-email` | Teacher (`email`, `otp`, `current_password`) |
| Forgot password | `POST /api/auth/otp/send/forgot-password` | Public (email or username) |
| Change email | `POST /api/auth/otp/send/change-email` | Student or teacher (logged in) |
| Change password | `POST /api/auth/otp/send/change-password` | Student or teacher (logged in) |
| Change username | `POST /api/auth/otp/send/change-username` | Teacher (logged in, has email) |

**Dev fallback:** If `SMTP_USER` / `SMTP_PASS` are missing, codes print as `[DEV OTP]` in the backend terminal. API responses include `dev_mode: true`. When SMTP is configured, `dev_mode` is false and no terminal banner is shown in the UI.

**Brevo sender:** `EMAIL_FROM` must **exactly match** a verified sender in Brevo → Senders & IP → Senders. Example: if Brevo shows `govindjadapalli92@gmail.com`, do not use `govind.jadapalli92@gmail.com` (Gmail treats dots as equivalent; Brevo does not).

**Setup:** Run `npm run setup:env` in `backend/` or copy `.env.example` → `.env`.

### Teacher first-time email setup

1. Teacher logs in with seeded credentials (`teacher` / `teacher123`)
2. `TeacherLayout` redirects to `/teacher/setup-email` until `users.email` is set
3. **Step 1:** Enter and confirm recovery email → OTP sent
4. **Step 2:** Enter 6-digit code
5. **Step 3:** Confirm with current password → `PATCH /account/setup-email`
6. Dashboard unlocks; submission notifications can use this email

### Teacher account settings (after email is set)

| Action | Verification |
|--------|----------------|
| Change email | OTP to **new** email |
| Change username | OTP to **registered** email |
| Change password | OTP to **registered** email |

Route: `/teacher/profile`

### Student registration & forgot password (multi-step UI)

Both flows use `AuthStepIndicator` (progress bar + mobile-friendly step labels):

| Flow | Steps |
|------|--------|
| Register | Email → Verify code → Username + password |
| Forgot password | Find account (email or username) → Verify code → New password |

Forgot password works for **students and teachers** who have a registered email.

### Forgot password flow

1. User opens `/forgot-password`
2. Enters registered **email** or **username** → masked email shown if found
3. `POST /api/auth/otp/send/forgot-password` → OTP sent
4. `POST /api/auth/reset-password` with email or username, OTP, new password

### Teacher submission notifications

When a student submits or updates work, the API emails the teacher if configured:

```env
TEACHER_NOTIFY_EMAIL=teacher@gmail.com
```

Without this, the app uses the first teacher user with an email in the database (after setup). In dev mode without SMTP, notifications log as `[DEV NOTIFY]`.

### Health check

`GET /api/health` returns:

```json
{
  "status": "ok",
  "email": { "configured": true, "mode": "smtp" }
}
```

`mode` is `smtp` or `dev-fallback` (no secrets exposed). On startup the backend logs the configured `EMAIL_FROM` sender.

### Git branch workflow

| Branch | Use |
|--------|-----|
| `development` | Daily work — **push here** |
| `staging` | Integration testing |
| `main` | Production releases |

See [CONTRIBUTING.md](../CONTRIBUTING.md). Do not commit `.env`, `data/`, or `*.db`.

### New frontend components

| Component | Purpose |
|-----------|---------|
| `AuthStepIndicator.jsx` | Multi-step auth progress (register, forgot password, teacher setup) |
| `OtpResendControl.jsx` | Resend button with countdown progress bar |
| `DevOtpNotice.jsx` | Banner when SMTP not configured |
| `ApiErrorState.jsx` | Mobile-friendly API error + retry |
| `useAsyncLoad.jsx` | Dashboard fetch with error handling |
| `ForgotPasswordPage.jsx` | Password reset (students + teachers) |
| `TeacherSetupEmail.jsx` | Teacher first-time email setup |
| `TeacherLayout.jsx` | Email-setup gate for teacher routes |

---

*Documentation version: 1.3 — Academy Assignment Portal*

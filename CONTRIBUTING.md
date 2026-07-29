# Contributing to Academy Assignment Portal

Thank you for contributing. Please follow this workflow so secrets stay safe and branches stay organized.

## Branch workflow

| Branch | Purpose |
|--------|---------|
| `development` | **Default** — all feature work and pushes go here |
| `staging` | Integration/testing — do not push directly unless agreed |
| `main` | Production-ready releases — do not push directly unless agreed |

```powershell
git checkout development
git pull origin development
# make changes
git add .
git commit -m "Describe your change"
git push origin development
```

Open pull requests **into `staging` or `main`** from `development` when ready for review.

## First-time setup

```powershell
git clone https://github.com/GoviGt650/assignment-portal.git
cd assignment-portal
git checkout development
npm run install:all
cd backend
npm run setup:env
npm run db:seed
npm run dev
```

In another terminal:

```powershell
cd frontend
npm run dev
```

App: http://localhost:5173

## Environment variables

- Copy **`backend/.env.example`** → **`backend/.env`** (or run `npm run setup:env` in `backend/`)
- **Never commit** `.env` — it is gitignored
- SMTP keys, JWT secret, and passwords stay local or in Render/Vercel env dashboards only

Required for real email OTP:

```env
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=xxx@smtp-brevo.com
SMTP_PASS=your-brevo-smtp-key
EMAIL_FROM=Academy ASP <your-verified-email@gmail.com>
```

Optional — email teacher when a student submits:

```env
TEACHER_NOTIFY_EMAIL=teacher@gmail.com
```

Without SMTP, OTP codes print in the **backend terminal** as `[DEV OTP]`.

## What not to commit

- `backend/.env`
- `node_modules/`
- `data/` and `*.db` (local SQLite)
- `uploads/`
- API keys or SMTP passwords in any tracked file

## Pull requests

Use the PR template checklist. Confirm:

- [ ] Tested locally (backend + frontend)
- [ ] No secrets in diff
- [ ] Branch is `development`
- [ ] `.env` not included

## Questions

See [docs/PROJECT_DOCUMENTATION.md](docs/PROJECT_DOCUMENTATION.md) and [docs/FREE_DEPLOYMENT_GUIDE.md](docs/FREE_DEPLOYMENT_GUIDE.md).

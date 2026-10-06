# TaskFlow

A calm, full-stack task manager. React + Express + MongoDB, with JWT
authentication, a sidebar workspace, grouped task lists, and a circular-reveal
theme transition.

**Live demo:** https://flowboard-flowboard-studio.vercel.app
**Repo:** https://github.com/PravinMandal/taskflow

## Features

- Signup / login with bcrypt-hashed passwords and JWT sessions
- Full task CRUD: title, description, status, priority, due date
- Sidebar workspace with live status counts and priority filtering
- Grouped sections (To do / In progress / Completed), debounced search
- Circular-reveal light/dark mode via the View Transitions API
- Production-grade backend: helmet, CORS, rate limiting, express-validator,
  centralized error handling with friendly messages
- Fully responsive (sidebar collapses to a scrollable nav on mobile)

## Project structure

```
taskflow/
├── api/index.js            # Vercel serverless entry (Express app)
├── server/src/
│   ├── app.js              # Express app factory
│   ├── index.js            # Local dev entry (node server/src/index.js)
│   ├── lib/{db,tokens}.js  # Mongoose connection cache, JWT helpers
│   ├── models/{User,Task}.js
│   ├── routes/{auth,tasks}.js
│   └── middleware/{auth,errorHandler,asyncHandler}.js
├── client/                 # React + Vite frontend (builds to client/dist)
└── vercel.json             # Build, routing, and cache config
```

## API

| Method | Route                   | Auth | Description            |
| ------ | ----------------------- | ---- | ---------------------- |
| POST   | `/api/auth/signup`      | No   | Create account, returns token |
| POST   | `/api/auth/login`       | No   | Log in, returns token  |
| GET    | `/api/auth/me`          | Yes  | Current user           |
| GET    | `/api/tasks`            | Yes  | List with search and filters |
| GET    | `/api/tasks/:id`        | Yes  | Single task            |
| POST   | `/api/tasks`            | Yes  | Create task            |
| PUT    | `/api/tasks/:id`        | Yes  | Update task            |
| PATCH  | `/api/tasks/:id/status` | Yes  | Quick status change    |
| DELETE | `/api/tasks/:id`        | Yes  | Delete task            |

Auth uses `Authorization: Bearer <jwt>`.

## Run locally

```bash
# 1. Backend deps + env
npm install
cp .env.example .env   # fill in MONGO_URI + JWT_SECRET

# 2. Start API (http://localhost:5000)
npm run dev:server

# 3. Frontend in a second terminal (http://localhost:5173)
npm install --prefix client
npm run dev --prefix client
```

## Deploy (Vercel)

Set `MONGO_URI` and `JWT_SECRET` as environment variables, then deploy.
`vercel.json` builds the client and serves the API from `/api`.

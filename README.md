# TaskFlow — Team Task Manager

A production-grade, full-stack Team Task Management application built with the **MERN stack** (MongoDB, Express.js, React, Node.js). TaskFlow enables teams to organize projects, assign tasks, track progress, and manage deadlines with strict role-based access control.

**[🌍 Live Demo](#)** <!-- Replace with your Railway deployment URL -->

---

## 📁 Folder Structure

```
team-task-manager/
├── package.json                  # Root config for unified Railway deployment
├── README.md                     # This file
│
├── server/                       # ── BACKEND (Node.js + Express) ──
│   ├── server.js                 # Entry point — Express app setup, middleware, static serving
│   ├── package.json              # Backend dependencies
│   ├── .env                      # Environment variables (not committed to Git)
│   │
│   ├── config/
│   │   └── db.js                 # MongoDB connection using Mongoose
│   │
│   ├── models/
│   │   ├── User.js               # User schema (name, email, password, role)
│   │   ├── Project.js            # Project schema (name, description, owner, members)
│   │   └── Task.js               # Task schema (title, status, priority, dueDate, assignedTo)
│   │
│   ├── middleware/
│   │   ├── auth.js               # JWT authentication middleware
│   │   ├── validate.js           # Express-validator result checker
│   │   └── errorHandler.js       # Global centralized error handler
│   │
│   └── routes/
│       ├── auth.js               # POST /signup, /login, GET /me, /users
│       ├── projects.js           # CRUD for projects + member management
│       └── tasks.js              # CRUD for tasks + status updates
│
├── client/                       # ── FRONTEND (React + Vite) ──
│   ├── package.json              # Frontend dependencies
│   ├── vite.config.js            # Vite bundler configuration
│   ├── index.html                # HTML entry point
│   ├── playwright.config.js      # Playwright E2E test configuration
│   │
│   ├── tests/
│   │   └── app.spec.js           # Playwright E2E test suite (11 tests)
│   │
│   └── src/
│       ├── main.jsx              # React DOM render entry
│       ├── App.jsx               # Root component — routing, providers
│       ├── App.css               # Complete design system & all component styles
│       │
│       ├── api/
│       │   └── axios.js          # Axios instance with JWT interceptor
│       │
│       ├── context/
│       │   ├── AuthContext.jsx    # Global auth state (user, login, signup, logout)
│       │   └── ToastContext.jsx   # Global toast notification system
│       │
│       ├── components/
│       │   ├── Sidebar.jsx       # Fixed sidebar navigation with user profile
│       │   ├── Navbar.jsx        # Legacy top navbar (replaced by Sidebar)
│       │   ├── ProjectCard.jsx   # Clickable project card for grid display
│       │   ├── TaskCard.jsx      # Task card with status dropdown & overdue badge
│       │   └── ProtectedRoute.jsx# Route guard — redirects unauthenticated users
│       │
│       └── pages/
│           ├── Dashboard.jsx     # Main dashboard — stats, tasks, team, progress
│           ├── Projects.jsx      # Project listing + create project modal
│           ├── ProjectDetail.jsx # Single project — tasks, members, filters
│           ├── Login.jsx         # Login form
│           ├── Signup.jsx        # Registration form with role selection
│           └── NotFound.jsx      # 404 error page
```

---

## 🔧 Tech Stack

| Layer        | Technology                                     |
|--------------|------------------------------------------------|
| **Frontend** | React 19, Vite 8, React Router 7, Axios        |
| **Backend**  | Node.js, Express.js 4, Express-Validator        |
| **Database** | MongoDB with Mongoose ODM                       |
| **Auth**     | JWT (jsonwebtoken) + Bcrypt.js password hashing |
| **Testing**  | Playwright (E2E browser testing)                |
| **Styling**  | Custom CSS (Syne + DM Sans fonts, dark theme)   |
| **Deploy**   | Railway (unified fullstack deployment)          |

---

## ✨ Features

### Authentication & Security
- **JWT-based authentication** — Token stored in localStorage, attached to every API request via Axios interceptor
- **Password hashing** — Bcrypt with 10 salt rounds before database storage
- **Role-based access** — Two roles: `Admin` and `Member`, enforced on both frontend and backend
- **Input validation** — All API routes validated with `express-validator` (email format, password length, ObjectId checks)
- **Global error handler** — Centralized middleware catches Mongoose errors, JWT errors, and validation errors

### Project Management
- **Create projects** (Admin only) — Name, description, and member assignment
- **Assign team members** — Admin can add/remove members from projects
- **View projects** — Members see only projects they belong to; Admins see all

### Task Management
- **Create tasks** (Admin only) — Title, description, priority (low/medium/high), assignee, due date
- **Update task status** — Drag between Todo → In Progress → Done
- **Permission control** — Members can only update tasks assigned to them; Admins can update any task
- **Overdue detection** — Tasks past their due date are flagged with a red "Overdue" badge
- **Delete tasks** (Admin only)

### Dashboard
- **4 Stat cards** — Total Projects, To Do, In Progress, Completed (with colored accents)
- **Task list** — Priority dots, circular checkboxes, assignee avatars
- **Team members panel** — Gradient avatars with online indicators and task counts
- **Project progress bars** — Gradient-filled progress bars showing completion %
- **Overdue section** — Full-width panel listing all late tasks with "Xd late" badges

### UI/UX
- **Dark-first design** — `#0e0f14` base with glassmorphic cards
- **Fixed sidebar** — 220px navigation with logo, nav links, badge counts, user profile
- **Toast notifications** — Slide-in success/error messages (auto-dismiss after 3s)
- **Loading states** — Button text changes to "Creating..." with disabled state to prevent double-submit
- **Animations** — FadeUp stagger on page load, hover lift on cards, smooth transitions
- **Responsive** — Sidebar collapses at 900px, grid adapts at 480px

---

## 🔌 API Endpoints

### Auth (`/api/auth`)
| Method | Endpoint    | Access  | Description                    |
|--------|-------------|---------|--------------------------------|
| POST   | `/signup`   | Public  | Register a new user            |
| POST   | `/login`    | Public  | Login and receive JWT token    |
| GET    | `/me`       | Private | Get current user profile       |
| GET    | `/users`    | Private | List all users (for assignment)|

### Projects (`/api/projects`)
| Method | Endpoint               | Access       | Description                 |
|--------|------------------------|--------------|-----------------------------|
| POST   | `/`                    | Admin only   | Create a new project        |
| GET    | `/`                    | Private      | Get all accessible projects |
| GET    | `/:id`                 | Private      | Get project details + tasks |
| DELETE | `/:id`                 | Admin only   | Delete a project            |
| POST   | `/:id/members`         | Admin only   | Add member to project       |
| DELETE | `/:id/members/:userId` | Admin only   | Remove member from project  |

### Tasks (`/api/tasks`)
| Method | Endpoint  | Access          | Description           |
|--------|-----------|-----------------|-----------------------|
| POST   | `/`       | Admin only      | Create a new task     |
| GET    | `/`       | Private         | Get all user's tasks  |
| PUT    | `/:id`    | Admin/Assignee  | Update task status    |
| DELETE | `/:id`    | Admin only      | Delete a task         |

---

## 🗄️ Database Models

### User
| Field    | Type   | Details                              |
|----------|--------|--------------------------------------|
| name     | String | Required, trimmed                    |
| email    | String | Required, unique, lowercase          |
| password | String | Required, min 6 chars, bcrypt hashed |
| role     | String | Enum: `admin` or `member`            |

### Project
| Field       | Type       | Details                          |
|-------------|------------|----------------------------------|
| name        | String     | Required                         |
| description | String     | Optional                         |
| owner       | ObjectId   | Ref → User (creator)             |
| members     | ObjectId[] | Ref → User (assigned team)       |

### Task
| Field       | Type     | Details                                  |
|-------------|----------|------------------------------------------|
| title       | String   | Required                                 |
| description | String   | Optional                                 |
| status      | String   | Enum: `todo`, `in-progress`, `done`      |
| priority    | String   | Enum: `low`, `medium`, `high`            |
| project     | ObjectId | Ref → Project                            |
| assignedTo  | ObjectId | Ref → User                               |
| dueDate     | Date     | Optional, used for overdue detection     |

---

## 🚀 Setup Instructions

### Prerequisites
- [Node.js](https://nodejs.org/) v18+
- [MongoDB](https://www.mongodb.com/) (local install or Atlas/Railway cloud)

### 1. Clone & Install
```bash
git clone https://github.com/yourusername/team-task-manager.git
cd team-task-manager
npm install
```

### 2. Configure Environment
Create `server/.env`:
```env
PORT=5000
MONGO_URI="your_mongodb_connection_string"
JWT_SECRET="your_secret_key"
```

### 3. Run Locally
**Terminal 1 — Backend:**
```bash
cd server
npm run dev
```
**Terminal 2 — Frontend:**
```bash
cd client
npm run dev
```
Open `http://localhost:5173` in your browser.

### 4. Run Tests
```bash
cd client
npx playwright test --reporter=line
```

---

## 🚢 Deployment (Railway)

This app is configured for **unified deployment** on Railway:

1. Push code to GitHub
2. Connect repo to Railway → Railway auto-detects the root `package.json`
3. Add environment variables in Railway dashboard:
   - `NODE_ENV=production`
   - `MONGO_URI=mongodb://...@mongodb.railway.internal:27017`
   - `JWT_SECRET=your_production_secret`
4. Deploy — Express serves both the API and the compiled React frontend

---

## 🧪 Testing

**11 Playwright E2E tests** covering:
- ✅ Login page rendering
- ✅ Navigation between login/signup
- ✅ Error handling for invalid credentials
- ✅ Admin signup → dashboard redirect
- ✅ Member signup
- ✅ Sidebar navigation links
- ✅ Dashboard stat cards
- ✅ Projects page navigation
- ✅ Admin create project button visibility
- ✅ Modal open/close behavior
- ✅ 404 page rendering

---

## 📄 License
This project is licensed under the MIT License.

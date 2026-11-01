# CampusGigs — Micro-Freelance Marketplace for Students

CampusGigs is a MERN-stack web application where university students can post short-term micro-gigs (graphic design, video editing, notes preparation, etc.) and other students can apply to them. It solves the problem of students having no dedicated platform to find and offer small paid tasks within their own campus community.

**Internship:** Zynvex Solutions — Batch 5 Virtual Internship (Full Stack Development)
**Intern:** Muhammad Abu Bakar | **Internship ID:** ZYNVEX-CERT-2182

---

## Module 1 — Summary of Work

### Objectives
1. Set up the Node/Express backend and React frontend.
2. Connect the backend to a cloud database (MongoDB Atlas).
3. Design all database schemas for the full project up front.
4. Implement secure user registration and login (password hashing + JWT).
5. Protect private routes on both backend and frontend.
6. Build the basic React layout and authentication pages.

### What was delivered
- **Backend:** Express server with CORS, JSON parsing, 404 and error handlers, environment-based config.
- **Database:** MongoDB Atlas connection through Mongoose; four schemas (User, Gig, Application, Message) with validation, defaults and indexes.
- **Authentication:** Register and login endpoints, passwords hashed with **bcrypt**, sessions handled with **JWT** (7-day expiry).
- **Authorization:** `protect` middleware (valid token required) and `authorize(role)` middleware (role-based access) ready for later modules.
- **Roles:** Two user roles — `client` (posts gigs) and `freelancer` (applies to gigs). A user cannot self-assign any other role.
- **Frontend:** React (Vite) app with Navbar, Home, Login, Register and Dashboard pages, global `AuthContext`, and a `ProtectedRoute` component that redirects unauthenticated users to the login page.
- **Session persistence:** The token is stored in `localStorage` and the user session is restored automatically on page refresh through `GET /api/auth/me`.
- **Validation and error handling:** Server-side validation (required fields, email format, minimum password length, duplicate email) with clear error messages shown in the UI.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 (Vite), React Router, Axios |
| Backend | Node.js, Express |
| Database | MongoDB Atlas, Mongoose |
| Authentication | JSON Web Tokens (jsonwebtoken), bcryptjs |
| Tools | Git, GitHub, VS Code, nodemon |

---

## Folder Structure

```
campusgigs/
├── server/
│   ├── config/
│   │   └── db.js               # MongoDB Atlas connection
│   ├── middleware/
│   │   └── auth.js             # protect + authorize(role)
│   ├── models/
│   │   ├── User.js
│   │   ├── Gig.js
│   │   ├── Application.js
│   │   └── Message.js
│   ├── routes/
│   │   └── auth.js             # register, login, me
│   ├── app.js                  # Express app (middleware + routes)
│   ├── index.js                # Entry point
│   └── .env.example
├── client/
│   └── src/
│       ├── components/         # Navbar, ProtectedRoute
│       ├── context/            # AuthContext (login, register, logout, session restore)
│       ├── pages/              # Home, Login, Register, Dashboard
│       ├── api.js              # Axios instance with JWT interceptor
│       ├── App.jsx             # Routes
│       └── main.jsx
└── README.md
```

---

## Database Schemas

### User
| Field | Type | Notes |
|---|---|---|
| name | String | required, min 2 characters |
| email | String | required, unique, lowercase, validated format |
| password | String | required, min 6 characters, **hashed with bcrypt**, never returned in queries by default |
| role | String | `client` or `freelancer` (default `freelancer`) |
| university | String | optional |
| skills | [String] | optional |
| createdAt / updatedAt | Date | automatic timestamps |

### Gig
| Field | Type | Notes |
|---|---|---|
| title, description | String | required |
| budget | Number | required, min 0 |
| tags | [String] | lowercase, indexed (used for filters in Module 3) |
| status | String | `open`, `in-progress`, `completed` (default `open`) |
| postedBy | ObjectId → User | required |
| deadline | Date | optional |

### Application
| Field | Type | Notes |
|---|---|---|
| gig | ObjectId → Gig | required |
| applicant | ObjectId → User | required |
| coverNote | String | optional |
| proposedPrice | Number | optional |
| status | String | `pending`, `accepted`, `rejected` (default `pending`) |

A unique compound index on `(gig, applicant)` prevents a user from applying to the same gig twice.

### Message
| Field | Type | Notes |
|---|---|---|
| gig | ObjectId → Gig | thread belongs to a gig |
| sender, receiver | ObjectId → User | required |
| text | String | required |
| read | Boolean | default `false` |

---

## API Endpoints (Module 1)

Base URL: `http://localhost:5000/api`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/auth/register` | Public | Create an account, returns user + JWT |
| POST | `/auth/login` | Public | Log in, returns user + JWT |
| GET | `/auth/me` | Protected | Returns the logged-in user (header: `Authorization: Bearer <token>`) |

**Register — request body**
```json
{
  "name": "Muhammad Abu Bakar",
  "email": "student@example.com",
  "password": "secret123",
  "university": "NFC IET Multan",
  "role": "client"
}
```

**Success response (201)**
```json
{
  "token": "<jwt>",
  "user": {
    "id": "...",
    "name": "Muhammad Abu Bakar",
    "email": "student@example.com",
    "role": "client",
    "university": "NFC IET Multan"
  }
}
```

**Error responses**

| Status | When |
|---|---|
| 400 | Missing fields, invalid email, password shorter than 6 characters |
| 401 | Wrong email/password, missing, invalid or expired token |
| 403 | Logged-in user's role is not allowed for the route |
| 409 | Email already registered |

---

## Authentication Flow

1. The user registers or logs in from the React app.
2. The server hashes the password (bcrypt, 10 rounds) on registration and verifies it on login.
3. The server returns a signed **JWT**; the client stores it in `localStorage`.
4. An Axios interceptor attaches `Authorization: Bearer <token>` to every request.
5. Protected API routes verify the token (`protect` middleware); protected React pages are wrapped in `ProtectedRoute`.
6. On page refresh, the app calls `/auth/me` to restore the session.

---

## Getting Started

### Prerequisites
- Node.js 18 or newer
- A free MongoDB Atlas cluster (connection string)

### 1. Backend
```bash
cd server
npm install
```
Create a `.env` file (see `.env.example`):
```env
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/campusgigs?retryWrites=true&w=majority
JWT_SECRET=your_long_random_secret
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
```
Start the server:
```bash
npm run dev
```
Expected output: `MongoDB connected: ...` and `Server running on port 5000`.

### 2. Frontend
```bash
cd client
npm install
npm run dev
```
Open http://localhost:5173.

### Troubleshooting
- **`querySrv ECONNREFUSED` when connecting to Atlas:** some ISPs block SRV DNS lookups. The server already sets public DNS servers (`8.8.8.8`, `1.1.1.1`) in `server/index.js` to avoid this.
- **`bad auth` error:** the username/password in `MONGO_URI` is wrong; reset the database user's password in Atlas > Database Access.
- **CORS error in the browser:** make sure `CLIENT_URL` in `server/.env` matches the address of the React app.

---

## Testing Done in Module 1

- Registered a new user through the UI and landed on the protected dashboard.
- Logged out and logged back in successfully.
- Verified in MongoDB Atlas that the user document is stored with a **hashed** password.
- Verified that visiting `/dashboard` while logged out redirects to `/login`.
- Verified error handling for duplicate email, wrong password and missing/invalid/expired tokens.


---

## Next Steps (Modules 2–4)

- **Module 2:** Gig CRUD (create, view, edit, delete), gig listing and details pages, apply-to-gig feature, student dashboard with posted/applied gigs.
- **Module 3:** Tag-based filters and search, applicant tracking dashboard (accept/reject), gig status management, in-app message threads.
- **Module 4:** Responsive UI polish, end-to-end testing, security checks, deployment (Render + MongoDB Atlas), final documentation.
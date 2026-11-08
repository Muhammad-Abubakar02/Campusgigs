# CampusGigs — Micro-Freelance Marketplace for Students

CampusGigs is a MERN-stack web application where university students can post short-term micro-gigs (graphic design, video editing, notes preparation, etc.) and other students can apply to them. It solves the problem of students having no dedicated platform to find and offer small paid tasks within their own campus community.

**Internship:** Zynvex Solutions — Batch 5 Virtual Internship (Full Stack Development)
**Intern:** Muhammad Abu Bakar | **Internship ID:** ZYNVEX-CERT-2182

---

## Project Progress

| Module | Dates | Focus | Status |
|---|---|---|---|
| **Module 1** | Oct 26 – Nov 01 | Setup, database schemas, authentication, protected routes, React layout | ✅ Complete |
| **Module 2** | Nov 02 – Nov 08 | Gig CRUD, listing/details pages, apply to gig, student dashboard | ✅ Complete |
| Module 3 | Nov 09 – Nov 15 | Tag filters and search, applicant tracking, status management, messaging | ⏳ Upcoming |
| Module 4 | Nov 16 – Nov 22 | Responsive polish, testing, deployment, final documentation | ⏳ Upcoming |

---

## Module 2 — Summary of Work

### Objectives
1. Build complete CRUD (create, read, update, delete) for gigs with server-side validation.
2. Let clients post gigs and freelancers apply to them.
3. Build the gig listing and gig details pages in React.
4. Build a role-based student dashboard showing posted gigs (clients) and applied gigs (freelancers).
5. Redesign the home page.

### What was delivered

**Backend (Express + Mongoose)**
- Full gig CRUD with role-based access: only **clients** can create gigs, and only the **owner** of a gig can edit or delete it.
- Server-side validation for every input (title 3–100 characters, description 10–2000 characters, budget 0–1,000,000, up to 8 tags of 20 characters each, valid non-past deadline). Tags are normalised (trimmed, lowercased, de-duplicated).
- Apply-to-gig feature for **freelancers**: optional cover note (max 1000 characters) and proposed price. Duplicate applications are blocked (HTTP 409, plus a unique database index), and gigs that are not `open` do not accept applications.
- Freelancers can view all their applications and withdraw a pending one.
- Deleting a gig also removes its applications and messages (no orphaned data).
- Invalid ids return 404 instead of crashing; every endpoint returns clear JSON error messages.
- Public gig list shows only open gigs and exposes only the poster's name and university (no email or password).

**Frontend (React)**
- **Home page** redesigned: hero section, categories, "How it works", and the latest gigs.
- **Browse Gigs** page with gig cards (title, budget, tags, poster, deadline) and an empty state.
- **Gig details** page: full description, applicants count, status badge, and a context-aware action area:
  - owner → Edit / Delete,
  - freelancer → apply form, or the status of their application with a Withdraw button,
  - visitor → "Login to apply" (returns to the gig after login),
  - other client → informational message.
- **Create / Edit gig** pages sharing one form component, with server validation errors shown in the form.
- **Role-based dashboard**
  - Client: stats (gigs posted, open gigs, total applicants) and a list of their gigs with applicant counts, Edit and Delete actions.
  - Freelancer: stats (applications, pending, accepted) and a list of applications with status, price and Withdraw.
- `ProtectedRoute` now supports role restrictions (`roles={['client']}`) and remembers the page the user wanted before logging in.
- Responsive layout, loading states, empty states and confirmation dialogs for destructive actions.

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
│   ├── config/db.js                # MongoDB Atlas connection
│   ├── middleware/
│   │   ├── auth.js                 # protect + authorize(role)
│   │   └── validateId.js           # 404 for invalid ObjectIds
│   ├── models/                     # User, Gig, Application, Message
│   ├── routes/
│   │   ├── auth.js                 # register, login, me
│   │   ├── gigs.js                 # gig CRUD + apply
│   │   └── applications.js         # my applications, withdraw
│   ├── app.js
│   └── index.js
└── client/
    └── src/
        ├── components/             # Navbar, ProtectedRoute, GigCard, GigForm, StatusBadge
        ├── context/                # AuthContext
        ├── pages/                  # Home, Login, Register, Dashboard, Gigs,
        │                           # GigDetails, CreateGig, EditGig
        ├── utils/format.js         # currency/date helpers
        ├── api.js                  # Axios instance with JWT interceptor
        └── App.jsx                 # Routes
```

---

## Database Schemas

### User
| Field | Type | Notes |
|---|---|---|
| name | String | required, min 2 characters |
| email | String | required, unique, lowercase, validated format |
| password | String | required, min 6 characters, **bcrypt hash**, hidden from queries by default |
| role | String | `client` or `freelancer` (default `freelancer`) |
| university | String | optional |
| skills | [String] | optional |

### Gig
| Field | Type | Notes |
|---|---|---|
| title, description | String | required |
| budget | Number | required, min 0 |
| tags | [String] | lowercase, indexed |
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

A unique compound index on `(gig, applicant)` prevents applying to the same gig twice.

### Message
| Field | Type | Notes |
|---|---|---|
| gig | ObjectId → Gig | thread belongs to a gig |
| sender, receiver | ObjectId → User | required |
| text | String | required |
| read | Boolean | default `false` |

(Messaging is implemented in Module 3.)

---

## API Endpoints

Base URL: `http://localhost:5000/api`

### Auth (Module 1)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/auth/register` | Public | Create an account, returns user + JWT |
| POST | `/auth/login` | Public | Log in, returns user + JWT |
| GET | `/auth/me` | Protected | Current user |

### Gigs (Module 2)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/gigs` | Public | List open gigs (newest first) |
| GET | `/gigs/mine` | Client | My gigs with applicant counts |
| GET | `/gigs/:id` | Public | Gig details with applicants count |
| POST | `/gigs` | Client | Create a gig |
| PUT | `/gigs/:id` | Owner | Edit a gig |
| DELETE | `/gigs/:id` | Owner | Delete a gig and its applications |
| POST | `/gigs/:id/apply` | Freelancer | Apply to a gig (cover note, proposed price) |
| GET | `/gigs/:id/application` | Logged in | My application for this gig (or `null`) |

### Applications (Module 2)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/applications/mine` | Freelancer | Gigs I applied to |
| DELETE | `/applications/:id` | Applicant | Withdraw a pending application |

Protected endpoints need the header `Authorization: Bearer <token>`.

**Create gig — request body**
```json
{
  "title": "Design a poster for our society dinner",
  "description": "We need an A3 poster for the annual dinner. Print ready PDF.",
  "budget": 2500,
  "tags": "design, poster, photoshop",
  "deadline": "2026-12-31"
}
```

**Common error responses**

| Status | When |
|---|---|
| 400 | Validation failed, or the gig is not open for applications |
| 401 | Missing, invalid or expired token |
| 403 | Wrong role, or not the owner of the gig / application |
| 404 | Gig / application not found or invalid id |
| 409 | Email already registered, or already applied to this gig |

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

### 2. Frontend
```bash
cd client
npm install
npm run dev
```
Open http://localhost:5173.

### Troubleshooting
- **`querySrv ECONNREFUSED` when connecting to Atlas:** some ISPs block SRV DNS lookups. The server sets public DNS servers (`8.8.8.8`, `1.1.1.1`) in `server/index.js` to avoid this.
- **`bad auth` error:** the username/password in `MONGO_URI` is wrong; reset the database user's password in Atlas > Database Access.
- **CORS error in the browser:** make sure `CLIENT_URL` in `server/.env` matches the address of the React app.

---

## Testing Done (Modules 1–2)

- Registration and login for both roles; protected pages redirect to login when logged out.
- **Client flow:** post a gig, see it on the dashboard, edit it, delete it; validation errors are shown in the form.
- **Freelancer flow:** browse gigs, open details, apply with a cover note and price, see the application on the dashboard, withdraw it.
- Access rules: a freelancer cannot post gigs; a client cannot apply; another client cannot edit or delete someone else's gig; duplicate applications are rejected.
- Password stored as a bcrypt hash in MongoDB Atlas.

---

## Next Steps (Modules 3–4)

- **Module 3:** Tag-based filters and search, applicant tracking dashboard (accept/reject), gig status management, in-app message threads.
- **Module 4:** Responsive UI polish, end-to-end testing, security checks, deployment (Render + MongoDB Atlas), final documentation.

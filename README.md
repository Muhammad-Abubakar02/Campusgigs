# CampusGigs — Micro-Freelance Marketplace for Students

CampusGigs is a MERN-stack web application where university students can post short-term micro-gigs (graphic design, video editing, notes preparation, etc.) and other students can apply to them. It solves the problem of students having no dedicated platform to find and offer small paid tasks within their own campus community.

**Live demo:** https://YOUR-APP.vercel.app  |  **API:** https://YOUR-API.vercel.app/api/health
> Both parts run on Vercel's free plan; the first API request after a pause can take a few seconds (serverless cold start).

**Internship:** Zynvex Solutions — Batch 5 Virtual Internship (Full Stack Development)
**Intern:** Muhammad Abu Bakar | **Internship ID:** ZYNVEX-CERT-2182

---

## Project Progress

| Module | Dates | Focus | Status |
|---|---|---|---|
| **Module 1** | Oct 26 – Nov 01 | Setup, database schemas, authentication, protected routes, React layout | ✅ Complete |
| **Module 2** | Nov 02 – Nov 08 | Gig CRUD, listing/details pages, apply to gig, student dashboard | ✅ Complete |
| **Module 3** | Nov 09 – Nov 15 | Tag filters and search, applicant tracking, status management, messaging | ✅ Complete |
| **Module 4** | Nov 16 – Nov 22 | Responsive polish, testing, security checks, deployment, final documentation | ✅ Complete |

---

## Module 4 — Summary of Work

### Objectives
1. Polish the UI for phones and tablets.
2. Harden the API (security checks) and prepare it for production.
3. Add automated and manual testing.
4. Deploy the application live and finish the documentation.

### What was delivered

**Security and production readiness (backend)**
- `helmet` security headers, a 10 KB JSON body limit and **rate limiting** (30 login/register attempts and 600 API requests per 15 minutes per IP).
- Login and registration accept only plain strings, which blocks NoSQL-injection style payloads such as `{"$gt": ""}`.
- CORS accepts one or several allowed frontend origins (`CLIENT_URL`, comma separated).
- `GET /api/health` endpoint for uptime checks.
- Malformed JSON now returns `400` and oversized bodies `413` instead of a generic server error.
- The server refuses to start without `MONGO_URI` / `JWT_SECRET` and prints a clear message.

**Responsive UI and polish (frontend)**
- Verified at 320, 390, 768 and 1024 px on every main page with no horizontal scrolling; filters, applicant cards, lists and the chat stack properly on small screens.
- Proper **404 page**, page title and meta description, and SPA rewrite rules so refreshing a deep link works after deployment.
- Logging out no longer leaves "return to" state behind for the next user.

**Testing**
- `npm run test:api` (in `server/`) — **40 automated end-to-end API checks** that can be run against the local or the deployed backend (see [TESTING.md](TESTING.md)).
- A 19-case manual test checklist and a security checklist in [TESTING.md](TESTING.md).

**Deployment**
- MongoDB Atlas (database) + Vercel (Express API as a serverless function, `server/api/index.js`) + Vercel (React build). Step-by-step instructions, environment variables and troubleshooting are in [DEPLOYMENT.md](DEPLOYMENT.md).

---

## Module 3 — Summary of Work

### Objectives
1. Let students find gigs quickly with search, tag filters, budget filters, sorting and pagination.
2. Let clients review applicants and accept or reject them (applicant tracking).
3. Manage the gig lifecycle: `open` → `in-progress` → `completed`.
4. Add in-app message threads between a gig owner and an applicant.

### What was delivered

**Search, filters and pagination**
- `GET /api/gigs` now accepts `q` (searches title, description and tags, case-insensitive), `tag` (comma separated, a gig must have *all* the tags), `minBudget`, `maxBudget`, `sort` (`newest`, `oldest`, `budget_high`, `budget_low`), `page` and `limit`. It returns `{ gigs, total, page, pages }`.
- Search text is regex-escaped, numeric params are validated and the page number is clamped, so bad input cannot crash the API.
- `GET /api/gigs/tags` returns the most used tags on open gigs and powers the clickable tag chips.
- The **Browse Gigs** page has a search box, budget range, sort dropdown, clickable tag chips, "Clear filters" and Previous/Next pagination. All filters live in the URL (for example `/gigs?tag=design&sort=budget_low`), so a filtered view can be shared and the browser back button works.
- Home page category chips and the tags on a gig page link straight to the filtered list.

**Applicant tracking (accept / reject)**
- `GET /api/gigs/:id/applications` (owner only) lists everyone who applied, with name, university, skills, cover note and proposed price.
- `PATCH /api/applications/:id/status` (gig owner only) accepts or rejects a pending application. Accepting moves the gig to **in-progress**; only one applicant can be accepted at a time; reviewed applications cannot be changed again.
- The gig page has an **Applicants** panel with Accept / Reject / Message buttons. Freelancers see the new status on their dashboard and on the gig page ("You were accepted!").

**Task status management**
- `PATCH /api/gigs/:id/status` (owner only): `in-progress` → `completed` ("Mark as completed"), or `in-progress` → `open` ("Reopen gig", which sets the accepted applicant back to pending). `completed` is final and a gig cannot be started without accepting someone.
- Only `open` gigs appear in Browse Gigs and only open gigs accept applications.
- The client dashboard now shows Posted / Open / In progress / Completed counts and an **Applicants** button on every gig.

**In-app messaging**
- New `routes/messages.js`: `GET /messages/threads` (inbox), `GET /messages/unread-count`, `GET /messages/:gigId/:userId` (conversation, marks the other person's messages as read) and `POST /messages/:gigId/:userId` (send, max 1000 characters).
- Access control: a conversation exists only between the gig owner and a person who applied to that gig. Outsiders, other applicants and self-messaging are rejected (403 / 400).
- Frontend: **Messages** inbox with unread badges and last-message preview, a chat screen with message bubbles, and an unread counter in the navbar. New messages are fetched by polling every 5–10 seconds.
- Deleting a gig deletes its messages as well.

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
| Backend | Node.js, Express 5, helmet, express-rate-limit |
| Database | MongoDB Atlas, Mongoose |
| Authentication | JSON Web Tokens (jsonwebtoken), bcryptjs |
| Hosting | Vercel (API and frontend), MongoDB Atlas (database) |
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
│   │   ├── gigs.js                 # gig CRUD, search/filters, apply, applicants, status
│   │   ├── applications.js         # my applications, withdraw, accept/reject
│   │   └── messages.js             # inbox, conversations, send message
│   ├── api/index.js                # Vercel serverless entry point
│   ├── tests/smoke.js              # automated end-to-end API test
│   ├── app.js                      # security middleware + routes
│   └── index.js
└── client/
    └── src/
        ├── components/             # Navbar (unread badge), ProtectedRoute, GigCard, GigForm, StatusBadge
        ├── context/                # AuthContext
        ├── pages/                  # Home, Login, Register, Dashboard, Gigs,
        │                           # GigDetails, CreateGig, EditGig, Messages, Conversation, NotFound
        ├── utils/format.js         # currency/date helpers
        ├── public/_redirects       # SPA rewrite (Netlify); vercel.json for Vercel
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

Messages are used by the in-app messaging feature (Module 3). Conversations are grouped by `(gig, sender, receiver)`.

---

## API Endpoints

Base URL: `http://localhost:5000/api`

### Health (Module 4)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/health` | Public | `{ "status": "ok" }` for uptime checks |

### Auth (Module 1)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/auth/register` | Public | Create an account, returns user + JWT |
| POST | `/auth/login` | Public | Log in, returns user + JWT |
| GET | `/auth/me` | Protected | Current user |

### Gigs (Modules 2–3)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/gigs` | Public | Open gigs. Query: `q`, `tag`, `minBudget`, `maxBudget`, `sort`, `page`, `limit` |
| GET | `/gigs/tags` | Public | Most used tags on open gigs (**Module 3**) |
| GET | `/gigs/mine` | Client | My gigs with applicant counts |
| GET | `/gigs/:id` | Public | Gig details with applicants count |
| POST | `/gigs` | Client | Create a gig |
| PUT | `/gigs/:id` | Owner | Edit a gig |
| DELETE | `/gigs/:id` | Owner | Delete a gig and its applications |
| POST | `/gigs/:id/apply` | Freelancer | Apply to a gig (cover note, proposed price) |
| GET | `/gigs/:id/application` | Logged in | My application for this gig (or `null`) |
| GET | `/gigs/:id/applications` | Owner | Applicants of my gig (**Module 3**) |
| PATCH | `/gigs/:id/status` | Owner | `completed` or `open` (reopen) from `in-progress` (**Module 3**) |

### Applications (Modules 2–3)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/applications/mine` | Freelancer | Gigs I applied to |
| PATCH | `/applications/:id/status` | Gig owner | Accept or reject a pending application (**Module 3**) |
| DELETE | `/applications/:id` | Applicant | Withdraw a pending application |

### Messages (Module 3)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/messages/threads` | Logged in | My conversations with last message and unread count |
| GET | `/messages/unread-count` | Logged in | Number of unread messages |
| GET | `/messages/:gigId/:userId` | Participant | Conversation with one person about one gig (marks as read) |
| POST | `/messages/:gigId/:userId` | Participant | Send a message `{ "text": "..." }` |

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
| 400 | Validation failed, invalid status change, or the gig is not open for applications |
| 401 | Missing, invalid or expired token |
| 403 | Wrong role, not the owner of the gig / application, or not part of the conversation |
| 404 | Gig / application not found or invalid id |
| 409 | Email already registered, or already applied to this gig |
| 413 | Request body larger than 10 KB |
| 429 | Too many requests (rate limit) |

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
`CLIENT_URL` may contain several allowed frontend addresses separated by commas.

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
Open http://localhost:5173. For a deployed backend set `VITE_API_URL=https://<your-api>/api` (see `client/.env.example`).

### 3. Run the automated API test (optional)
With the backend running:
```bash
cd server
npm run test:api
```

### Deployment
See [DEPLOYMENT.md](DEPLOYMENT.md) for the Vercel + Atlas setup.

### Troubleshooting
- **`querySrv ECONNREFUSED` when connecting to Atlas:** some ISPs block SRV DNS lookups. The server sets public DNS servers (`8.8.8.8`, `1.1.1.1`) in `server/index.js` to avoid this.
- **`bad auth` error:** the username/password in `MONGO_URI` is wrong; reset the database user's password in Atlas > Database Access.
- **CORS error in the browser:** make sure `CLIENT_URL` in `server/.env` matches the address of the React app.

---

## Testing Done (Modules 1–4)

- Registration and login for both roles; protected pages redirect to login when logged out.
- **Client flow:** post a gig, see it on the dashboard, edit it, delete it; validation errors are shown in the form.
- **Freelancer flow:** browse gigs, open details, apply with a cover note and price, see the application on the dashboard, withdraw it.
- Access rules: a freelancer cannot post gigs; a client cannot apply; another client cannot edit or delete someone else's gig; duplicate applications are rejected.
- Password stored as a bcrypt hash in MongoDB Atlas.
- **Module 3 — search & filters:** search by title/tag, single and multiple tag filters, budget range, all four sort orders, pagination and page clamping, regex characters in search, invalid numbers ignored.
- **Module 3 — applicants:** only the gig owner can list/accept/reject; accepting sets the gig to in-progress and hides it from Browse; a second accept and re-reviewing are blocked; accepted applications cannot be withdrawn; applicant emails are never exposed.
- **Module 3 — status:** open → completed and manual open → in-progress are rejected; in-progress → open resets the accepted applicant; completed is final.
- **Module 3 — messaging:** owner ⇄ applicant conversation, unread counts and read receipts, outsiders / other applicants / non-applicants blocked, empty and over-long messages rejected, messages removed when a gig is deleted.
- Automated checks: 59 API checks for Module 3 (68 for Modules 1–2 still pass) and a 26-step browser test covering the full flow (search → apply → accept/reject → chat → complete) plus a mobile layout check.
- **Module 4:** 40-check end-to-end API script (`npm run test:api`), layout checks at 320/390/768/1024 px on all main pages, rate-limit and malformed-input checks. Full details in [TESTING.md](TESTING.md).

---

## Future Improvements
- Real-time chat with Socket.io instead of polling.
- Ratings and reviews after a gig is completed.
- File attachments for deliverables and email notifications.
- Profile pages with portfolio links for freelancers.

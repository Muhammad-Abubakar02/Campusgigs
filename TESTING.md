# Testing

## 1. Automated API test (40 checks)
Runs a full scenario against any running API: registration and login, validation, role and ownership rules, search/filters, applying, accept/reject, status changes, messaging access control and cleanup.

```bash
cd server
npm run test:api                                                   # local API on port 5000
API_URL=https://<your-service>.onrender.com/api npm run test:api   # deployed API
```
The script creates its own throw-away users (random emails) and deletes the gig it creates, so it can be run repeatedly.

## 2. Manual test checklist (browser)

| # | Area | Steps | Expected |
|---|---|---|---|
| 1 | Auth | Register as client and as freelancer | Redirected to the dashboard |
| 2 | Auth | Login with a wrong password | Error message, no login |
| 3 | Protected routes | Open `/dashboard` and `/messages` while logged out | Redirected to Login, then back after login |
| 4 | Roles | Freelancer opens `/gigs/new` | Redirected to dashboard |
| 5 | Gig CRUD | Client posts, edits and deletes a gig | Changes visible on list and dashboard |
| 6 | Validation | Post a gig with a 2-letter title or negative budget | Server error shown in the form |
| 7 | Search | Search by a word from a title | Only matching gigs; URL contains `?q=` |
| 8 | Tag filter | Click two tag chips | Only gigs with both tags |
| 9 | Budget / sort | Min/max budget and each sort option | List updates correctly |
| 10 | Pagination | More than 12 gigs | Previous / Next work |
| 11 | Apply | Freelancer applies; applies again | Success; second time blocked |
| 12 | Applicants | Client opens Applicants on the gig | List with notes and prices |
| 13 | Accept | Accept an applicant | Gig becomes in-progress; hidden from Browse |
| 14 | Reject | Reject another applicant | Badge shows rejected |
| 15 | Status | Mark as completed / Reopen | Status badge updates |
| 16 | Messaging | Client messages the applicant, applicant replies | Messages appear, unread badge in navbar, cleared after reading |
| 17 | Access | Open someone else's conversation URL | "You are not part of this conversation" |
| 18 | Responsive | Resize to 320 / 390 / 768 px | No horizontal scroll, filters and lists stack |
| 19 | 404 | Open `/some-random-page` | "Page not found" screen |

## 3. Security checks performed
- Passwords are stored only as bcrypt hashes and never returned by the API.
- JWT required on every private route; role (`authorize`) and ownership checks on every write.
- Login/register only accept plain strings (blocks NoSQL-injection style objects).
- Search text is regex-escaped; numeric query params are validated and clamped.
- `helmet` security headers, 10 KB request body limit, rate limiting (30 login/register attempts and 600 API requests per 15 minutes per IP).
- CORS restricted to the configured frontend URL(s).
- Applicant e-mails are never exposed to gig owners; public gig data shows only the poster's name and university.
- Invalid ids return 404 and malformed JSON returns 400 instead of a server error.
- `.env` is git-ignored; `.env.example` files contain placeholders only.

// End-to-end API smoke test. Runs against ANY running CampusGigs API (local or deployed).
//   npm run test:api                                   -> http://localhost:5000/api
//   API_URL=https://your-api.onrender.com/api npm run test:api
// It creates its own throw-away users (random emails) and gigs, and deletes the gigs afterwards.
const BASE = (process.env.API_URL || 'http://localhost:5000/api').replace(/\/$/, '');
const run = Date.now().toString(36);
let pass = 0;
let fail = 0;

const ok = (name, cond, extra) => {
  if (cond) pass++; else fail++;
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${cond ? '' : `   -> ${JSON.stringify(extra)}`}`);
};

async function call(method, path, body, token) {
  const res = await fetch(BASE + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  let json = {};
  try { json = await res.json(); } catch { /* empty body */ }
  return { status: res.status, json };
}

const register = async (name, role) => {
  const r = await call('POST', '/auth/register', {
    name, email: `${name.toLowerCase().replace(/\s/g, '.')}.${run}@smoke.test`, password: 'secret123', role, university: 'Smoke Test Uni',
  });
  return { token: r.json.token, id: r.json.user?.id, status: r.status };
};

(async () => {
  console.log(`Testing ${BASE}\n`);
  let r = await call('GET', '/health');
  ok('health check', r.status === 200 && r.json.status === 'ok', r);

  // ---- auth ----
  const client = await register('Smoke Client', 'client');
  const other = await register('Smoke Other', 'client');
  const free1 = await register('Smoke Freelancer One', 'freelancer');
  const free2 = await register('Smoke Freelancer Two', 'freelancer');
  ok('register 2 clients + 2 freelancers', [client, other, free1, free2].every((u) => u.status === 201 && u.token));
  r = await call('POST', '/auth/register', { name: 'Dup', email: `smoke.client.${run}@smoke.test`, password: 'secret123' });
  ok('duplicate email -> 409', r.status === 409, r);
  r = await call('POST', '/auth/login', { email: `smoke.client.${run}@smoke.test`, password: 'wrongpass' });
  ok('wrong password -> 401', r.status === 401, r);
  r = await call('POST', '/auth/login', { email: { $gt: '' }, password: { $gt: '' } });
  ok('NoSQL-injection style login -> 400', r.status === 400, r);
  r = await call('POST', '/auth/login', { email: `smoke.client.${run}@smoke.test`, password: 'secret123' });
  ok('login works', r.status === 200 && !!r.json.token && !JSON.stringify(r.json).includes('password'), r);
  r = await call('GET', '/auth/me', null, client.token);
  ok('/auth/me with token', r.status === 200 && r.json.user.role === 'client', r);
  r = await call('GET', '/auth/me', null, 'not.a.token');
  ok('invalid token -> 401', r.status === 401, r);

  // ---- gigs + validation ----
  const good = { title: `Smoke poster ${run}`, description: 'Design an A3 poster for the society event', budget: 1500, tags: 'smoke, design', deadline: '2099-01-01' };
  r = await call('POST', '/gigs', good, free1.token);
  ok('freelancer cannot post gig -> 403', r.status === 403, r);
  r = await call('POST', '/gigs', { ...good, title: 'ab' }, client.token);
  ok('short title -> 400', r.status === 400, r);
  r = await call('POST', '/gigs', { ...good, budget: -5 }, client.token);
  ok('negative budget -> 400', r.status === 400, r);
  r = await call('POST', '/gigs', good, client.token);
  const gig = r.json.gig;
  ok('client creates gig', r.status === 201 && gig?._id, r);
  r = await call('PUT', `/gigs/${gig._id}`, { ...good, title: 'Hacked title' }, other.token);
  ok('other client cannot edit -> 403', r.status === 403, r);
  r = await call('PUT', `/gigs/${gig._id}`, { ...good, budget: 2000 }, client.token);
  ok('owner edits gig', r.status === 200 && r.json.gig.budget === 2000, r);
  r = await call('GET', `/gigs/not-an-id`);
  ok('invalid id -> 404 (not 500)', r.status === 404, r);

  // ---- search / filters ----
  r = await call('GET', `/gigs?q=${run}`);
  ok('search finds gig', r.status === 200 && r.json.gigs.some((g) => g._id === gig._id), r);
  r = await call('GET', '/gigs?tag=smoke&minBudget=1900&maxBudget=2100');
  ok('tag + budget filter', r.json.gigs?.some((g) => g._id === gig._id), r);
  r = await call('GET', '/gigs?q=%5B.*&page=abc&limit=zzz');
  ok('weird query params do not crash', r.status === 200, r);
  r = await call('GET', '/gigs/tags');
  ok('tags endpoint', r.status === 200 && Array.isArray(r.json.tags), r);

  // ---- apply + applicants ----
  r = await call('POST', `/gigs/${gig._id}/apply`, { coverNote: 'I can do it', proposedPrice: 1800 }, client.token);
  ok('client cannot apply -> 403', r.status === 403, r);
  r = await call('POST', `/gigs/${gig._id}/apply`, { coverNote: 'I can do it', proposedPrice: 1800 }, free1.token);
  ok('freelancer applies', r.status === 201, r);
  const app1 = r.json.application;
  r = await call('POST', `/gigs/${gig._id}/apply`, {}, free1.token);
  ok('duplicate application -> 409', r.status === 409, r);
  r = await call('POST', `/gigs/${gig._id}/apply`, {}, free2.token);
  const app2 = r.json.application;
  ok('second freelancer applies', r.status === 201, r);
  r = await call('GET', `/gigs/${gig._id}/applications`, null, other.token);
  ok('non-owner cannot list applicants -> 403', r.status === 403, r);
  r = await call('GET', `/gigs/${gig._id}/applications`, null, client.token);
  ok('owner lists 2 applicants, no emails leaked', r.status === 200 && r.json.applications.length === 2 && !JSON.stringify(r.json).includes('@smoke.test'), r);

  // ---- accept / reject / status ----
  r = await call('PATCH', `/applications/${app1._id}/status`, { status: 'accepted' }, free1.token);
  ok('freelancer cannot accept -> 403', r.status === 403, r);
  r = await call('PATCH', `/applications/${app2._id}/status`, { status: 'rejected' }, client.token);
  ok('owner rejects applicant', r.status === 200 && r.json.application.status === 'rejected', r);
  r = await call('PATCH', `/applications/${app1._id}/status`, { status: 'accepted' }, client.token);
  ok('owner accepts -> gig in-progress', r.status === 200 && r.json.gigStatus === 'in-progress', r);
  r = await call('GET', `/gigs?q=${run}`);
  ok('in-progress gig hidden from Browse', !r.json.gigs.some((g) => g._id === gig._id), r);
  r = await call('PATCH', `/gigs/${gig._id}/status`, { status: 'completed' }, other.token);
  ok('other client cannot change status -> 403', r.status === 403, r);

  // ---- messaging ----
  r = await call('POST', `/messages/${gig._id}/${free1.id}`, { text: 'Please start today' }, client.token);
  ok('owner messages applicant', r.status === 201, r);
  r = await call('POST', `/messages/${gig._id}/${client.id}`, { text: 'Sure!' }, free1.token);
  ok('applicant replies', r.status === 201, r);
  r = await call('POST', `/messages/${gig._id}/${client.id}`, { text: 'hi' }, other.token);
  ok('outsider cannot message -> 403', r.status === 403, r);
  r = await call('POST', `/messages/${gig._id}/${free1.id}`, { text: '   ' }, client.token);
  ok('empty message -> 400', r.status === 400, r);
  r = await call('GET', '/messages/unread-count', null, client.token);
  ok('unread count works', r.status === 200 && r.json.count === 1, r);
  r = await call('GET', `/messages/${gig._id}/${free1.id}`, null, client.token);
  ok('conversation has 2 messages in order', r.status === 200 && r.json.messages.map((m) => m.text).join('|') === 'Please start today|Sure!', r);
  r = await call('GET', `/messages/${gig._id}/${free1.id}`, null, free2.token);
  ok('stranger cannot read conversation -> 403', r.status === 403, r);

  r = await call('PATCH', `/gigs/${gig._id}/status`, { status: 'completed' }, client.token);
  ok('owner completes gig', r.status === 200 && r.json.gig.status === 'completed', r);

  // ---- cleanup ----
  r = await call('DELETE', `/gigs/${gig._id}`, null, client.token);
  ok('owner deletes gig (and its applications/messages)', r.status === 200, r);
  r = await call('GET', `/gigs/${gig._id}`);
  ok('deleted gig -> 404', r.status === 404, r);

  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})().catch((e) => {
  console.error('Could not reach the API:', e.message);
  process.exit(1);
});

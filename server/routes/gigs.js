const express = require('express');
const Gig = require('../models/Gig');
const Application = require('../models/Application');
const Message = require('../models/Message');
const { protect, authorize } = require('../middleware/auth');
const validateId = require('../middleware/validateId');

const router = express.Router();

const MAX_TAGS = 8;

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

// Validates and normalises gig input. Returns { data, errors }.
function cleanGigInput(body, { requireFuture = false } = {}) {
  const errors = [];
  const title = String(body.title ?? '').trim();
  const description = String(body.description ?? '').trim();
  const budget = Number(body.budget);

  if (title.length < 3 || title.length > 100) errors.push('Title must be 3-100 characters');
  if (description.length < 10 || description.length > 2000) {
    errors.push('Description must be 10-2000 characters');
  }
  if (
    body.budget === undefined || body.budget === null || body.budget === '' ||
    Number.isNaN(budget) || budget < 0 || budget > 1000000
  ) {
    errors.push('Budget must be a number between 0 and 1,000,000');
  }

  const rawTags = Array.isArray(body.tags) ? body.tags : String(body.tags ?? '').split(',');
  const tags = [...new Set(rawTags.map((t) => String(t).trim().toLowerCase()).filter(Boolean))];
  if (tags.length > MAX_TAGS) errors.push(`Maximum ${MAX_TAGS} tags allowed`);
  if (tags.some((t) => t.length > 20)) errors.push('Each tag must be 20 characters or less');

  let deadline;
  if (body.deadline) {
    deadline = new Date(body.deadline);
    if (Number.isNaN(deadline.getTime())) {
      errors.push('Deadline is not a valid date');
    } else if (requireFuture && deadline < startOfToday()) {
      errors.push('Deadline cannot be in the past');
    }
  }

  return { data: { title, description, budget, tags, deadline }, errors };
}

const isOwner = (gig, user) => String(gig.postedBy) === String(user._id);

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const SORTS = {
  newest: { createdAt: -1 },
  oldest: { createdAt: 1 },
  budget_high: { budget: -1, createdAt: -1 },
  budget_low: { budget: 1, createdAt: -1 },
};

const numberParam = (v) => (v !== undefined && v !== '' && !Number.isNaN(Number(v)) ? Number(v) : null);

// GET /api/gigs  (public) - open gigs with search, tag/budget filters, sorting and pagination
// Query: q, tag (comma separated, all must match), minBudget, maxBudget, sort, page, limit
router.get('/', async (req, res) => {
  const filter = { status: 'open' };

  const q = String(req.query.q ?? '').trim().slice(0, 100);
  if (q) {
    const re = { $regex: escapeRegex(q), $options: 'i' };
    filter.$or = [{ title: re }, { description: re }, { tags: re }];
  }

  const tags = String(req.query.tag ?? '')
    .split(',')
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean)
    .slice(0, MAX_TAGS);
  if (tags.length) filter.tags = { $all: tags };

  const budget = {};
  const min = numberParam(req.query.minBudget);
  const max = numberParam(req.query.maxBudget);
  if (min !== null) budget.$gte = min;
  if (max !== null) budget.$lte = max;
  if (Object.keys(budget).length) filter.budget = budget;

  const sort = SORTS[req.query.sort] || SORTS.newest;
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 12, 1), 50);

  const total = await Gig.countDocuments(filter);
  const pages = Math.max(Math.ceil(total / limit), 1);
  const page = Math.min(Math.max(parseInt(req.query.page, 10) || 1, 1), pages);

  const gigs = await Gig.find(filter)
    .sort(sort)
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('postedBy', 'name university')
    .lean();
  res.json({ gigs, total, page, pages });
});

// GET /api/gigs/tags  (public) - most used tags on open gigs (for the filter chips)
router.get('/tags', async (req, res) => {
  const gigs = await Gig.find({ status: 'open' }).select('tags').lean();
  const counts = {};
  gigs.forEach((g) => g.tags.forEach((t) => { counts[t] = (counts[t] || 0) + 1; }));
  const tags = Object.entries(counts)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 20)
    .map(([tag, count]) => ({ tag, count }));
  res.json({ tags });
});

// GET /api/gigs/mine  (client) - my gigs with applicant counts
router.get('/mine', protect, authorize('client'), async (req, res) => {
  const gigs = await Gig.find({ postedBy: req.user._id }).sort({ createdAt: -1 }).lean();
  const counts = await Promise.all(gigs.map((g) => Application.countDocuments({ gig: g._id })));
  res.json({ gigs: gigs.map((g, i) => ({ ...g, applicantsCount: counts[i] })) });
});

// GET /api/gigs/:id  (public)
router.get('/:id', validateId(), async (req, res) => {
  const gig = await Gig.findById(req.params.id).populate('postedBy', 'name university').lean();
  if (!gig) return res.status(404).json({ message: 'Gig not found' });
  const applicantsCount = await Application.countDocuments({ gig: gig._id });
  res.json({ gig: { ...gig, applicantsCount } });
});

// POST /api/gigs  (client) - create a gig
router.post('/', protect, authorize('client'), async (req, res) => {
  const { data, errors } = cleanGigInput(req.body, { requireFuture: true });
  if (errors.length) return res.status(400).json({ message: errors.join(', ') });
  const gig = await Gig.create({ ...data, postedBy: req.user._id });
  res.status(201).json({ gig });
});

// PUT /api/gigs/:id  (owner) - edit a gig
router.put('/:id', protect, authorize('client'), validateId(), async (req, res) => {
  const gig = await Gig.findById(req.params.id);
  if (!gig) return res.status(404).json({ message: 'Gig not found' });
  if (!isOwner(gig, req.user)) {
    return res.status(403).json({ message: 'You can only edit your own gigs' });
  }
  const { data, errors } = cleanGigInput(req.body);
  if (errors.length) return res.status(400).json({ message: errors.join(', ') });

  gig.title = data.title;
  gig.description = data.description;
  gig.budget = data.budget;
  gig.tags = data.tags;
  gig.deadline = data.deadline; // undefined clears it
  await gig.save();
  res.json({ gig });
});

// DELETE /api/gigs/:id  (owner) - delete a gig and everything attached to it
router.delete('/:id', protect, authorize('client'), validateId(), async (req, res) => {
  const gig = await Gig.findById(req.params.id);
  if (!gig) return res.status(404).json({ message: 'Gig not found' });
  if (!isOwner(gig, req.user)) {
    return res.status(403).json({ message: 'You can only delete your own gigs' });
  }
  await Application.deleteMany({ gig: gig._id });
  await Message.deleteMany({ gig: gig._id });
  await gig.deleteOne();
  res.json({ message: 'Gig deleted' });
});

// GET /api/gigs/:id/applications  (owner) - everyone who applied to my gig
router.get('/:id/applications', protect, authorize('client'), validateId(), async (req, res) => {
  const gig = await Gig.findById(req.params.id);
  if (!gig) return res.status(404).json({ message: 'Gig not found' });
  if (!isOwner(gig, req.user)) {
    return res.status(403).json({ message: 'Only the gig owner can view applicants' });
  }
  const applications = await Application.find({ gig: gig._id })
    .sort({ createdAt: -1 })
    .populate('applicant', 'name university skills')
    .lean();
  res.json({ applications: applications.filter((a) => a.applicant) });
});

// PATCH /api/gigs/:id/status  (owner) - move a gig through its lifecycle
//   open -> in-progress happens automatically when an applicant is accepted
//   in-progress -> completed   (work finished)
//   in-progress -> open        (hire cancelled: the accepted applicant goes back to pending)
const STATUS_TRANSITIONS = { 'in-progress': ['completed', 'open'] };

router.patch('/:id/status', protect, authorize('client'), validateId(), async (req, res) => {
  const gig = await Gig.findById(req.params.id);
  if (!gig) return res.status(404).json({ message: 'Gig not found' });
  if (!isOwner(gig, req.user)) {
    return res.status(403).json({ message: 'You can only change the status of your own gigs' });
  }

  const next = String(req.body.status ?? '');
  if (gig.status === 'open' && next === 'in-progress') {
    return res.status(400).json({ message: 'Accept an applicant to start the work' });
  }
  if (!(STATUS_TRANSITIONS[gig.status] || []).includes(next)) {
    return res.status(400).json({ message: `A ${gig.status} gig cannot be changed to "${next}"` });
  }

  if (next === 'open') {
    const accepted = await Application.findOne({ gig: gig._id, status: 'accepted' });
    if (accepted) {
      accepted.status = 'pending';
      await accepted.save();
    }
  }
  gig.status = next;
  await gig.save();
  res.json({ gig });
});

// GET /api/gigs/:id/application  (logged in) - my application for this gig (or null)
router.get('/:id/application', protect, validateId(), async (req, res) => {
  const application = await Application.findOne({ gig: req.params.id, applicant: req.user._id });
  res.json({ application: application || null });
});

// POST /api/gigs/:id/apply  (freelancer) - apply to a gig
router.post('/:id/apply', protect, authorize('freelancer'), validateId(), async (req, res) => {
  const gig = await Gig.findById(req.params.id);
  if (!gig) return res.status(404).json({ message: 'Gig not found' });
  if (gig.status !== 'open') {
    return res.status(400).json({ message: 'This gig is no longer accepting applications' });
  }

  const coverNote = String(req.body.coverNote ?? '').trim();
  if (coverNote.length > 1000) {
    return res.status(400).json({ message: 'Cover note must be 1000 characters or less' });
  }
  let proposedPrice;
  if (req.body.proposedPrice !== undefined && req.body.proposedPrice !== null && req.body.proposedPrice !== '') {
    proposedPrice = Number(req.body.proposedPrice);
    if (Number.isNaN(proposedPrice) || proposedPrice < 0 || proposedPrice > 1000000) {
      return res.status(400).json({ message: 'Proposed price must be a number between 0 and 1,000,000' });
    }
  }

  if (await Application.findOne({ gig: gig._id, applicant: req.user._id })) {
    return res.status(409).json({ message: 'You have already applied to this gig' });
  }
  try {
    const application = await Application.create({
      gig: gig._id,
      applicant: req.user._id,
      coverNote,
      proposedPrice,
    });
    res.status(201).json({ application });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'You have already applied to this gig' });
    }
    throw err;
  }
});

module.exports = router;

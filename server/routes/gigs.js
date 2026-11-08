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

// GET /api/gigs  (public) - latest open gigs
router.get('/', async (req, res) => {
  const gigs = await Gig.find({ status: 'open' })
    .sort({ createdAt: -1 })
    .limit(100)
    .populate('postedBy', 'name university')
    .lean();
  res.json({ gigs });
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

const express = require('express');
const Gig = require('../models/Gig');
const User = require('../models/User');
const Application = require('../models/Application');
const Message = require('../models/Message');
const { protect } = require('../middleware/auth');
const validateId = require('../middleware/validateId');

const router = express.Router();

// A conversation always belongs to a gig and happens between the gig's owner and
// one person who applied to that gig. Anyone else is rejected.
async function checkParticipants(gigId, meId, otherId) {
  const gig = await Gig.findById(gigId);
  if (!gig) return { status: 404, message: 'Gig not found' };
  if (String(meId) === String(otherId)) {
    return { status: 400, message: 'You cannot message yourself' };
  }
  const meIsOwner = String(gig.postedBy) === String(meId);
  const otherIsOwner = String(gig.postedBy) === String(otherId);
  const applicantId = meIsOwner ? otherId : otherIsOwner ? meId : null;
  if (!applicantId || !(await Application.findOne({ gig: gig._id, applicant: applicantId }))) {
    return { status: 403, message: 'You are not part of this conversation' };
  }
  return { gig };
}

// GET /api/messages/unread-count - number of unread messages (navbar badge)
router.get('/unread-count', protect, async (req, res) => {
  const count = await Message.countDocuments({ receiver: req.user._id, read: false });
  res.json({ count });
});

// GET /api/messages/threads - my conversations (inbox), newest first
router.get('/threads', protect, async (req, res) => {
  const messages = await Message.find({ $or: [{ sender: req.user._id }, { receiver: req.user._id }] })
    .sort({ createdAt: -1 })
    .populate('gig', 'title status')
    .populate('sender', 'name university')
    .populate('receiver', 'name university')
    .lean();

  const threads = new Map();
  for (const m of messages) {
    if (!m.gig || !m.sender || !m.receiver) continue;
    const mine = String(m.sender._id) === String(req.user._id);
    const other = mine ? m.receiver : m.sender;
    const key = `${m.gig._id}:${other._id}`;
    if (!threads.has(key)) {
      threads.set(key, {
        gig: m.gig,
        other,
        lastMessage: { text: m.text, createdAt: m.createdAt, mine },
        unread: 0,
      });
    }
    if (!mine && !m.read) threads.get(key).unread += 1;
  }
  res.json({ threads: [...threads.values()] });
});

// GET /api/messages/:gigId/:userId - the conversation with one person about one gig
router.get('/:gigId/:userId', protect, validateId('gigId'), validateId('userId'), async (req, res) => {
  const check = await checkParticipants(req.params.gigId, req.user._id, req.params.userId);
  if (check.status) return res.status(check.status).json({ message: check.message });

  const other = await User.findById(req.params.userId);
  if (!other) return res.status(404).json({ message: 'User not found' });

  const messages = await Message.find({
    gig: check.gig._id,
    $or: [
      { sender: req.user._id, receiver: other._id },
      { sender: other._id, receiver: req.user._id },
    ],
  })
    .sort({ createdAt: 1 })
    .lean();

  // opening the conversation marks the other person's messages as read
  await Message.updateMany(
    { gig: check.gig._id, sender: other._id, receiver: req.user._id, read: false },
    { read: true }
  );

  res.json({
    gig: { _id: check.gig._id, title: check.gig.title, status: check.gig.status },
    other: { _id: other._id, name: other.name, university: other.university },
    messages,
  });
});

// POST /api/messages/:gigId/:userId - send a message
router.post('/:gigId/:userId', protect, validateId('gigId'), validateId('userId'), async (req, res) => {
  const check = await checkParticipants(req.params.gigId, req.user._id, req.params.userId);
  if (check.status) return res.status(check.status).json({ message: check.message });

  const text = String(req.body.text ?? '').trim();
  if (!text) return res.status(400).json({ message: 'Message cannot be empty' });
  if (text.length > 1000) {
    return res.status(400).json({ message: 'Message must be 1000 characters or less' });
  }

  const message = await Message.create({
    gig: check.gig._id,
    sender: req.user._id,
    receiver: req.params.userId,
    text,
  });
  res.status(201).json({ message });
});

module.exports = router;

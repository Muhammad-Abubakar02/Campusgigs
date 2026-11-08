const express = require('express');
const Application = require('../models/Application');
const { protect, authorize } = require('../middleware/auth');
const validateId = require('../middleware/validateId');

const router = express.Router();

// GET /api/applications/mine  (freelancer) - gigs I applied to
router.get('/mine', protect, authorize('freelancer'), async (req, res) => {
  const applications = await Application.find({ applicant: req.user._id })
    .sort({ createdAt: -1 })
    .populate('gig', 'title budget status tags')
    .lean();
  res.json({ applications: applications.filter((a) => a.gig) });
});

// DELETE /api/applications/:id  (applicant) - withdraw a pending application
router.delete('/:id', protect, authorize('freelancer'), validateId(), async (req, res) => {
  const application = await Application.findById(req.params.id);
  if (!application) return res.status(404).json({ message: 'Application not found' });
  if (String(application.applicant) !== String(req.user._id)) {
    return res.status(403).json({ message: 'You can only withdraw your own applications' });
  }
  if (application.status !== 'pending') {
    return res.status(400).json({ message: 'Only pending applications can be withdrawn' });
  }
  await application.deleteOne();
  res.json({ message: 'Application withdrawn' });
});

module.exports = router;

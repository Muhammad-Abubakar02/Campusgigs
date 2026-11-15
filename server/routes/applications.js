const express = require('express');
const Application = require('../models/Application');
const Gig = require('../models/Gig');
const { protect, authorize } = require('../middleware/auth');
const validateId = require('../middleware/validateId');

const router = express.Router();

// GET /api/applications/mine  (freelancer) - gigs I applied to
router.get('/mine', protect, authorize('freelancer'), async (req, res) => {
  const applications = await Application.find({ applicant: req.user._id })
    .sort({ createdAt: -1 })
    .populate('gig', 'title budget status tags postedBy')
    .lean();
  res.json({ applications: applications.filter((a) => a.gig) });
});

// PATCH /api/applications/:id/status  (gig owner) - accept or reject an applicant
//   accepting moves the gig to "in-progress" (only one applicant can be accepted at a time)
router.patch('/:id/status', protect, authorize('client'), validateId(), async (req, res) => {
  const application = await Application.findById(req.params.id);
  if (!application) return res.status(404).json({ message: 'Application not found' });
  const gig = await Gig.findById(application.gig);
  if (!gig) return res.status(404).json({ message: 'Gig not found' });
  if (String(gig.postedBy) !== String(req.user._id)) {
    return res.status(403).json({ message: 'Only the gig owner can review applications' });
  }

  const status = String(req.body.status ?? '');
  if (!['accepted', 'rejected'].includes(status)) {
    return res.status(400).json({ message: 'Status must be "accepted" or "rejected"' });
  }
  if (application.status !== 'pending') {
    return res.status(400).json({ message: 'Only pending applications can be reviewed' });
  }

  if (status === 'accepted') {
    if (gig.status !== 'open') {
      return res.status(400).json({ message: 'You can only accept an applicant while the gig is open' });
    }
    application.status = 'accepted';
    await application.save();
    gig.status = 'in-progress';
    await gig.save();
  } else {
    application.status = 'rejected';
    await application.save();
  }
  res.json({ application, gigStatus: gig.status });
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

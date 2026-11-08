const mongoose = require('mongoose');

// Returns 404 early when :id is not a valid MongoDB ObjectId (avoids CastError -> 500)
module.exports = (param = 'id') => (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params[param])) {
    return res.status(404).json({ message: 'Not found' });
  }
  next();
};

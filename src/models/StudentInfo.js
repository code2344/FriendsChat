const mongoose = require('mongoose');

const studentInfoSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  studentCode: {
    type: String,
    required: true
  },
  gradeLevel: {
    type: Number,
    required: true
  },
  initialYear: {
    type: Number,
    required: true
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('StudentInfo', studentInfoSchema);

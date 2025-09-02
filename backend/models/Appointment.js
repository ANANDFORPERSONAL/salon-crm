const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true
  },
  serviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: true
  },
  // Legacy field for backward compatibility
  staffId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staff',
    required: false
  },
  // New multi-staff support
  staffAssignments: [{
    staffId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Staff',
      required: true
    },
    percentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    role: {
      type: String,
      default: 'primary' // primary, secondary, assistant, etc.
    }
  }],
  date: {
    type: String,
    required: true
  },
  time: {
    type: String,
    required: true
  },
  duration: {
    type: Number,
    default: 60
  },
  status: {
    type: String,
    enum: ['scheduled', 'confirmed', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  notes: {
    type: String,
    default: ''
  },
  price: {
    type: Number,
    required: true,
    min: 0
  }
}, {
  timestamps: true
});

// Validation middleware to ensure staff percentages add up to 100%
appointmentSchema.pre('save', function(next) {
  if (this.staffAssignments && this.staffAssignments.length > 0) {
    const totalPercentage = this.staffAssignments.reduce((sum, assignment) => sum + assignment.percentage, 0);
    if (Math.abs(totalPercentage - 100) > 0.01) { // Allow for small floating point differences
      return next(new Error('Staff assignment percentages must add up to 100%'));
    }
  }
  next();
});

// Helper method to get primary staff member
appointmentSchema.methods.getPrimaryStaff = function() {
  if (this.staffId) {
    return this.staffId; // Legacy support
  }
  const primaryAssignment = this.staffAssignments.find(assignment => assignment.role === 'primary');
  return primaryAssignment ? primaryAssignment.staffId : this.staffAssignments[0]?.staffId;
};

// Helper method to get all staff members
appointmentSchema.methods.getAllStaff = function() {
  if (this.staffId) {
    return [this.staffId]; // Legacy support
  }
  return this.staffAssignments.map(assignment => assignment.staffId);
};

module.exports = mongoose.model('Appointment', appointmentSchema); 
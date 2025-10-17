const mongoose = require('mongoose');
const crypto = require('crypto');

const passwordResetTokenSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  token: { 
    type: String, 
    required: true,
    unique: true 
  },
  email: { 
    type: String, 
    required: true 
  },
  expiresAt: { 
    type: Date, 
    required: true,
    default: () => new Date(Date.now() + 15 * 60 * 1000) // 15 minutes
  },
  used: { 
    type: Boolean, 
    default: false 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
}, {
  timestamps: true
});

// Index for automatic cleanup of expired tokens
passwordResetTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Static method to generate reset token
passwordResetTokenSchema.statics.generateToken = function() {
  return crypto.randomBytes(32).toString('hex');
};

// Instance method to check if token is valid
passwordResetTokenSchema.methods.isValid = function() {
  return !this.used && this.expiresAt > new Date();
};

// Export both schema and model for flexibility
module.exports = {
  schema: passwordResetTokenSchema,
  model: mongoose.model('PasswordResetToken', passwordResetTokenSchema)
};

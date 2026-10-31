// PASSWORD_RESET table -> PasswordReset collection (6-digit OTP tokens)
const mongoose = require('mongoose');
const { toJSONPlugin } = require('../utils/helper');

const passwordResetSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 150 },
    user_role: { type: String, required: true, enum: ['Student', 'Faculty', 'Admin'] },
    token: { type: String, required: true, maxlength: 255 },
    expiry: { type: Date, required: true },
    used: { type: Number, default: 0 } // TINYINT(1): 0 = unused, 1 = used
  },
  { timestamps: { createdAt: 'created_at', updatedAt: false }, collection: 'password_reset' }
);

passwordResetSchema.index({ token: 1 });

passwordResetSchema.plugin(toJSONPlugin);
module.exports = mongoose.models.PasswordReset || mongoose.model('PasswordReset', passwordResetSchema);

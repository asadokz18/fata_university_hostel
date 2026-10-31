// ADMIN table -> Admin collection
const mongoose = require('mongoose');
const { toJSONPlugin } = require('../utils/helper');

const adminSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true, lowercase: true, maxlength: 100 },
    full_name: { type: String, required: true, trim: true, maxlength: 150 },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true, maxlength: 150 },
    password: { type: String, required: true },
    profile_photo: { type: String, default: null }
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }, collection: 'admin' }
);

adminSchema.plugin(toJSONPlugin);
module.exports = mongoose.models.Admin || mongoose.model('Admin', adminSchema);

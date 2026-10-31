// GALLERY table -> Gallery collection
const mongoose = require('mongoose');
const { toJSONPlugin } = require('../utils/helper');

const gallerySchema = new mongoose.Schema(
  {
    uploaded_by_id: { type: mongoose.Schema.Types.ObjectId, required: true },
    uploaded_by_role: { type: String, required: true, enum: ['Admin', 'Student', 'Faculty'] },
    image_path: { type: String, required: true },
    caption: { type: String, default: null, maxlength: 255 },
    status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
    approved_at: { type: Date, default: null }
  },
  { timestamps: { createdAt: 'uploaded_at', updatedAt: false }, collection: 'gallery' }
);

gallerySchema.plugin(toJSONPlugin);
module.exports = mongoose.models.Gallery || mongoose.model('Gallery', gallerySchema);

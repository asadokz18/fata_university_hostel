// NOTICES table -> Notice collection
const mongoose = require('mongoose');
const { toJSONPlugin } = require('../utils/helper');

const noticeSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 255 },
    message: { type: String, required: true },
    priority: { type: String, enum: ['Urgent', 'Important', 'Normal'], default: 'Normal' },
    target_audience: { type: String, enum: ['All', 'Students', 'Faculty'], default: 'All' },
    expiry_date: { type: String, default: null }, // 'YYYY-MM-DD' or null
    created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', default: null },
    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' }
  },
  { timestamps: { createdAt: 'created_at', updatedAt: false }, collection: 'notices' }
);

noticeSchema.plugin(toJSONPlugin);
module.exports = mongoose.models.Notice || mongoose.model('Notice', noticeSchema);

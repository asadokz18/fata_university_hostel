// COMPLAINTS table -> Complaint collection
const mongoose = require('mongoose');
const { toJSONPlugin } = require('../utils/helper');

const complaintSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, required: true },
    user_role: { type: String, required: true, enum: ['Student', 'Faculty'] },
    title: { type: String, required: true, trim: true, maxlength: 255 },
    description: { type: String, required: true },
    status: { type: String, enum: ['Pending', 'In Progress', 'Resolved'], default: 'Pending' },
    admin_response: { type: String, default: null },
    resolved_at: { type: Date, default: null }
  },
  { timestamps: { createdAt: 'submitted_at', updatedAt: false }, collection: 'complaints' }
);

complaintSchema.index({ user_id: 1, user_role: 1 });

complaintSchema.plugin(toJSONPlugin);
module.exports = mongoose.models.Complaint || mongoose.model('Complaint', complaintSchema);

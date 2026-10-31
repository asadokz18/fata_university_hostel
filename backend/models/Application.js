// APPLICATIONS table -> Application collection (room apply / leave requests)
const mongoose = require('mongoose');
const { toJSONPlugin } = require('../utils/helper');

const applicationSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, required: true },
    user_role: { type: String, required: true, enum: ['Student', 'Faculty'] },
    room_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
    application_type: { type: String, enum: ['Apply', 'Leave'], required: true, default: 'Apply' },
    booking_duration: { type: String, default: null, maxlength: 100 },
    status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], required: true, default: 'Pending' },
    remarks: { type: String, default: null }
  },
  { timestamps: { createdAt: 'applied_at', updatedAt: 'updated_at' }, collection: 'applications' }
);

applicationSchema.index({ user_id: 1, user_role: 1 });
applicationSchema.index({ room_id: 1, status: 1, application_type: 1 });

applicationSchema.plugin(toJSONPlugin);
module.exports = mongoose.models.Application || mongoose.model('Application', applicationSchema);

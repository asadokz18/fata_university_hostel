// ROOMS table -> Room collection
const mongoose = require('mongoose');
const { toJSONPlugin } = require('../utils/helper');

const roomSchema = new mongoose.Schema(
  {
    hostel_name: { type: String, required: true, enum: ['FAQIR IPI HOUSE', 'FATIMA HOUSE', 'KHYBER HOUSE'] },
    room_no: { type: String, required: true, trim: true, maxlength: 20 },
    capacity: { type: Number, required: true, default: 2 },
    available_spaces: { type: Number, required: true, default: 2 },
    description: { type: String, default: null },
    room_image: { type: String, default: null },
    status: { type: String, enum: ['Available', 'Full', 'Maintenance'], default: 'Available' }
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }, collection: 'rooms' }
);

// UNIQUE KEY unique_room (hostel_name, room_no)
roomSchema.index({ hostel_name: 1, room_no: 1 }, { unique: true });

roomSchema.plugin(toJSONPlugin);
module.exports = mongoose.models.Room || mongoose.model('Room', roomSchema);

// STUDENT table -> Student collection
const mongoose = require('mongoose');
const { toJSONPlugin, CI } = require('../utils/helper');

const studentSchema = new mongoose.Schema(
  {
    full_name: { type: String, required: true, trim: true, maxlength: 150 },
    father_name: { type: String, required: true, trim: true, maxlength: 150 },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true, maxlength: 150 },
    phone: { type: String, required: true, trim: true, maxlength: 20 },
    gender: { type: String, required: true, enum: ['Male', 'Female'] },
    cnic: { type: String, required: true, trim: true, maxlength: 20 },
    dob: { type: String, required: true }, // 'YYYY-MM-DD' (DATE column)
    department: { type: String, required: true, trim: true, maxlength: 100 },
    semester: { type: String, required: true, trim: true, maxlength: 50 },
    registration_no: { type: String, required: true, trim: true, maxlength: 50 },
    home_address: { type: String, required: true, trim: true },
    profile_photo: { type: String, default: '' },
    password: { type: String, required: true },
    reset_token: { type: String, default: null },
    reset_token_expiry: { type: Date, default: null },
    joining_date: { type: String, default: null }, // 'YYYY-MM-DD'
    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' }
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }, collection: 'student' }
);

studentSchema.index({ cnic: 1 }, { unique: true, collation: CI });
studentSchema.index({ registration_no: 1 }, { unique: true, collation: CI });

studentSchema.plugin(toJSONPlugin);
module.exports = mongoose.models.Student || mongoose.model('Student', studentSchema);

// FACULTY table -> Faculty collection
const mongoose = require('mongoose');
const { toJSONPlugin, CI } = require('../utils/helper');

const facultySchema = new mongoose.Schema(
  {
    full_name: { type: String, required: true, trim: true, maxlength: 150 },
    father_name: { type: String, required: true, trim: true, maxlength: 150 },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true, maxlength: 150 },
    phone: { type: String, required: true, trim: true, maxlength: 20 },
    gender: { type: String, required: true, enum: ['Male', 'Female'] },
    cnic: { type: String, required: true, trim: true, maxlength: 20 },
    dob: { type: String, required: true }, // 'YYYY-MM-DD'
    designation: { type: String, required: true, trim: true, maxlength: 100 },
    department: { type: String, required: true, trim: true, maxlength: 100 },
    employee_id: { type: String, required: true, trim: true, maxlength: 50 },
    qualification: { type: String, required: true, trim: true, maxlength: 100 },
    home_address: { type: String, required: true, trim: true },
    profile_photo: { type: String, default: '' },
    password: { type: String, required: true },
    reset_token: { type: String, default: null },
    reset_token_expiry: { type: Date, default: null },
    joining_date: { type: String, default: null }, // 'YYYY-MM-DD'
    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' }
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }, collection: 'faculty' }
);

facultySchema.index({ cnic: 1 }, { unique: true, collation: CI });
facultySchema.index({ employee_id: 1 }, { unique: true, collation: CI });

facultySchema.plugin(toJSONPlugin);
module.exports = mongoose.models.Faculty || mongoose.model('Faculty', facultySchema);

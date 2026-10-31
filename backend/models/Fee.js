// FEES table -> Fee collection
const mongoose = require('mongoose');
const { toJSONPlugin } = require('../utils/helper');

const feeSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, required: true },
    user_role: { type: String, required: true, enum: ['Student', 'Faculty'] },
    user_name: { type: String, required: true, trim: true, maxlength: 150 },
    amount: { type: Number, required: true },
    fee_month: { type: String, required: true, maxlength: 20 },
    fee_year: { type: Number, required: true },
    status: { type: String, enum: ['Paid', 'Unpaid', 'Partial', 'Pending Verification'], default: 'Unpaid' },
    payment_method: { type: String, default: null, maxlength: 50 },
    transaction_id: { type: String, default: null, maxlength: 100 },
    payment_proof: { type: String, default: null },
    payment_date: { type: String, default: null }, // 'YYYY-MM-DD'
    receipt_no: { type: String, default: null, maxlength: 50 },
    notes: { type: String, default: null }
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }, collection: 'fees' }
);

feeSchema.index({ user_id: 1, user_role: 1 });

feeSchema.plugin(toJSONPlugin);
module.exports = mongoose.models.Fee || mongoose.model('Fee', feeSchema);

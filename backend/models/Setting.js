// SETTINGS table -> Setting collection (SMTP key/value records)
const mongoose = require('mongoose');
const { toJSONPlugin } = require('../utils/helper');

const settingSchema = new mongoose.Schema(
  {
    setting_key: { type: String, required: true, unique: true, maxlength: 100 },
    setting_value: { type: String, default: null }
  },
  { timestamps: { createdAt: false, updatedAt: 'updated_at' }, collection: 'settings' }
);

settingSchema.plugin(toJSONPlugin);
module.exports = mongoose.models.Setting || mongoose.model('Setting', settingSchema);

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const emailSchema = new Schema({
  address: { type: String, required: true },
  forwarding: { type: String, required: true },
  status: { type: String, enum: ['active', 'inactive', 'deleted'], default: 'active' },
  purpose: { type: String },
  deletedAt: { type: Date }
}, { _id: false });

const emailVerificationSchema = new Schema({
  token: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, expires: '1h' },
  verified: { type: Boolean, default: false }
}, { _id: false });

const userSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String },
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
  createdEmails: [emailSchema],
  plan: { type: String, enum: ['free', 'paid'], default: 'free' },
  paymentDate: { type: Date, default: Date.now },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  permissions: { type: [String], default: [] },
  phone: { type: String },
  payments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Payment' }],
  refreshToken: { type: String },
  emailVerification: emailVerificationSchema, // Esquema de verificação de e-mail
  emailVerified: { type: Boolean, default: false }
});

const User = mongoose.model('User', userSchema);

module.exports = User;

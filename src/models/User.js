
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const emailSchema = new Schema({
  address: { type: String, required: true },
  forwarding: { type: String, required: true },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
}, { _id: false });

const userSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: false },
  createdEmails: [emailSchema],
  plan: { type: String, enum: ['free', 'paid'], default: 'free' },
  paymentDate: { type: Date, default: Date.now },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  permissions: { type: [String], default: [] },
  phone: { type: String }, // Adicionando o campo de telefone
  payments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Payment' }],
  refreshToken: { type: String }
});

const User = mongoose.model('User', userSchema);

module.exports = User;

import mongoose from 'mongoose';

const addressSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  label: { type: String, required: true }, // "Home", "Office", "Apartment", etc.
  flat: { type: String },
  building: { type: String },
  street: { type: String },
  area: { type: String, required: true },
  landmark: { type: String },
  city: { type: String, required: true },
  pincode: { type: String, required: true },
  coordinates: { type: [Number] }, // [longitude, latitude]
  formattedAddress: { type: String },
  isDefault: { type: Boolean, default: false },
  lastUsed: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model('Address', addressSchema);

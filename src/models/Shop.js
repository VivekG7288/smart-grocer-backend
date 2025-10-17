import mongoose from 'mongoose';

const locationSchema = {
  type: { type: String, enum: ['Point'], default: 'Point' },
  coordinates: { type: [Number], required: true }, // [longitude, latitude]
  address: { type: String, required: true },
  city: { type: String },
  state: { type: String },
  pincode: { type: String },
  area: { type: String }
};

const shopSchema = new mongoose.Schema({
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  phone: { type: String },
  location: locationSchema,
  deliveryRadius: { type: Number, default: 5 },
  isActive: { type: Boolean, default: true },
  openingHours: {
    open: { type: String, default: '09:00' },
    close: { type: String, default: '21:00' }
  }
}, { timestamps: true });

// Create geospatial index for location-based queries
shopSchema.index({ location: '2dsphere' });

export default mongoose.model('Shop', shopSchema);

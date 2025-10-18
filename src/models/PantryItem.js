import mongoose from 'mongoose';

const pantryItemSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  productName: { type: String, required: true },
  brandName: { type: String },
  quantityPerPack: { type: Number, required: true },
  unit: { type: String, required: true },
  packsOwned: { type: Number, default: 2 },
  currentPacks: { type: Number, default: 2 },
  refillThreshold: { type: Number, default: 1 },
  status: { 
    type: String, 
    enum: ['STOCKED', 'LOW', 'REFILL_REQUESTED', 'CONFIRMED', 'OUT_FOR_DELIVERY', 'DELIVERED'], 
    default: 'STOCKED' 
  },
  price: { type: Number, required: true },
  lastRefilled: { type: Date },
  notes: { type: String },
  refillFrequency: { type: String, enum: ['WEEKLY', 'BIWEEKLY', 'MONTHLY'], default: 'WEEKLY' },
  
  // Add delivery address to pantry item
  deliveryAddress: {
    flat: { type: String },
    building: { type: String },
    street: { type: String },
    area: { type: String },
    landmark: { type: String },
    city: { type: String },
    pincode: { type: String },
    coordinates: { type: [Number] },
    formattedAddress: { type: String }
  }
}, { timestamps: true });

pantryItemSchema.index({ userId: 1, shopId: 1, productId: 1 }, { unique: true });

export default mongoose.model('PantryItem', pantryItemSchema);

import mongoose from 'mongoose';

const consumerInventorySchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true },
  currentStock: { type: Number, default: 0 },
  initialQuantity: { type: Number, default: 1 },
  lowStockThreshold: { type: Number, default: 0 },
  lastUpdated: { type: Date, default: Date.now },
  autoReorder: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model('ConsumerInventoryItem', consumerInventorySchema);

import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true },
  name: { type: String, required: true },
  category: { type: String },
  price: { type: Number, required: true },
  stock: { type: Number, default: 0 },
  unit: { type: String },
  image: { type: String }
}, { timestamps: true });

export default mongoose.model('Product', productSchema);

import Order from '../models/Order.js';
import Product from '../models/Product.js';

// Create new order
export const createOrder = async (req, res) => {
  try {
    console.log('Creating order with data:', req.body);
    
    const order = new Order(req.body);
    
    // Validate delivery address
    if (!order.deliveryAddress.area || !order.deliveryAddress.city || !order.deliveryAddress.pincode) {
      return res.status(400).json({ 
        error: 'Complete delivery address (area, city, pincode) is required' 
      });
    }
    
    // Decrease stock for each product
    for (const item of order.items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(400).json({ error: `Product ${item.productId} not found` });
      }
      
      if (product.stock < item.quantity) {
        return res.status(400).json({ 
          error: `Insufficient stock for ${product.name}. Only ${product.stock} available.` 
        });
      }
      
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { stock: -item.quantity }
      });
    }
    
    await order.save();
    
    // Populate references for response
    await order.populate('customerId', 'name email');
    await order.populate('shopId', 'name');
    await order.populate('items.productId', 'name price');
    
    console.log('Order created successfully:', order);
    res.status(201).json(order);
  } catch (err) {
    console.error('Error creating order:', err);
    res.status(400).json({ error: err.message });
  }
};

// Get all orders
export const getOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('customerId', 'name email phone')
      .populate('shopId', 'name')
      .populate('items.productId', 'name price')
      .sort({ orderDate: -1 });
    
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get order by ID
export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('customerId', 'name email')
      .populate('shopId', 'name')
      .populate('items.productId', 'name price');
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update order status/details
export const updateOrderStatus = async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(order);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Delete order
export const deleteOrder = async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    // Optionally restore stock
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { stock: item.quantity }
      });
    }
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

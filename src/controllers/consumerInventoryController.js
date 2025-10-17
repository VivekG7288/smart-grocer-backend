import ConsumerInventoryItem from '../models/ConsumerInventoryItem.js';

// Create new inventory item
export const createInventoryItem = async (req, res) => {
  try {
    const item = new ConsumerInventoryItem(req.body);
    await item.save();
    res.status(201).json(item);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Get all inventory items (with optional filters)
export const getInventoryItems = async (req, res) => {
  try {
    const filters = {};
    if (req.query.customerId) filters.customerId = req.query.customerId;
    if (req.query.shopId) filters.shopId = req.query.shopId;
    const items = await ConsumerInventoryItem.find(filters)
      .populate('customerId', 'name email')
      .populate('productId', 'name category price')
      .populate('shopId', 'name address');
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get inventory item by ID
export const getInventoryItemById = async (req, res) => {
  try {
    const item = await ConsumerInventoryItem.findById(req.params.id)
      .populate('customerId', 'name email')
      .populate('productId', 'name category price')
      .populate('shopId', 'name address');
    if (!item) return res.status(404).json({ error: 'Item not found' });
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update inventory item
export const updateInventoryItem = async (req, res) => {
  try {
    const item = await ConsumerInventoryItem.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!item) return res.status(404).json({ error: 'Item not found' });
    res.json(item);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Delete inventory item
export const deleteInventoryItem = async (req, res) => {
  try {
    await ConsumerInventoryItem.findByIdAndDelete(req.params.id);
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

import ConsumerInventoryItem from '../models/ConsumerInventoryItem.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { sendNotification } from '../utils/firebase.js';

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
    ).populate({
      path: 'customerId',
      select: 'name email fcmToken'
    }).populate({
      path: 'shopId',
      select: 'name ownerId'
    }).populate('productId');

    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    // Check if quantity is below threshold and send notifications
    if (item.quantity <= item.minQuantity) {
      // Get shop owner FCM token
      const shopOwner = await User.findById(item.shopId.ownerId, 'fcmToken');

      // Create notifications
      const notifications = [
        new Notification({
          userId: item.customerId._id,
          title: "Low Inventory Alert",
          message: `Your ${item.productId.name} is running low. Current quantity: ${item.quantity}`,
          type: "LOW_INVENTORY",
          data: { inventoryItemId: item._id }
        }),
        new Notification({
          userId: item.shopId.ownerId,
          title: "Refill Request",
          message: `Customer ${item.customerId.name} needs a refill for ${item.productId.name}`,
          type: "REFILL_REQUEST",
          data: { inventoryItemId: item._id }
        })
      ];

      // Save notifications
      await Promise.all(notifications.map(n => n.save()));

      // Send FCM notifications
      if (item.customerId.fcmToken) {
        await sendNotification(item.customerId.fcmToken, {
          title: "Low Inventory Alert",
          body: `Your ${item.productId.name} is running low. Current quantity: ${item.quantity}`,
          data: {
            type: "LOW_INVENTORY",
            inventoryItemId: item._id.toString()
          }
        });
      }

      if (shopOwner?.fcmToken) {
        await sendNotification(shopOwner.fcmToken, {
          title: "Refill Request",
          body: `Customer ${item.customerId.name} needs a refill for ${item.productId.name}`,
          data: {
            type: "REFILL_REQUEST",
            inventoryItemId: item._id.toString()
          }
        });
      }
    }

    res.json(item);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Delete inventory item
export const deleteInventoryItem = async (req, res) => {
  try {
    const item = await ConsumerInventoryItem.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ error: 'Item not found' });
    res.json({ message: 'Item deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

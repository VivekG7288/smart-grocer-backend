import express from 'express';
import {
  createInventoryItem,
  getInventoryItems,
  getInventoryItemById,
  updateInventoryItem,
  deleteInventoryItem
} from '../controllers/consumerInventoryController.js';

const router = express.Router();

// Create a new consumer inventory item
router.post('/', createInventoryItem);

// Get all inventory items (optionally filter by customerId or shopId via query)
router.get('/', getInventoryItems);

// Get a single inventory item by ID
router.get('/:id', getInventoryItemById);

// Update an inventory item by ID
router.put('/:id', updateInventoryItem);

// Delete an inventory item by ID
router.delete('/:id', deleteInventoryItem);

export default router;

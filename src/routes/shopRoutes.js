import express from 'express';
import {
  createShop,
  getShops,
  getShopById,
  updateShop,
  deleteShop
} from '../controllers/shopController.js';

const router = express.Router();

// Create a new shop
router.post('/', createShop);

// Get all shops
router.get('/', getShops);

// Get a single shop by ID
router.get('/:id', getShopById);

// Update a shop by ID
router.put('/:id', updateShop);

// Delete a shop by ID
router.delete('/:id', deleteShop);

export default router;

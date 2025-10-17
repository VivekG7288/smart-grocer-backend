import express from 'express';
import {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  deleteOrder
} from '../controllers/orderController.js';

const router = express.Router();

// Create a new order
router.post('/', createOrder);

// Get all orders (optionally filter by customerId or shopId via query)
router.get('/', getOrders);

// Get a single order by ID
router.get('/:id', getOrderById);

// Update order status or details by ID
router.put('/:id', updateOrderStatus);

// Delete an order by ID
router.delete('/:id', deleteOrder);

export default router;

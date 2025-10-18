import express from 'express';
import {
  addToPantry,
  getUserPantry,
  updatePantryItem,
  getShopRefillRequests,
  confirmRefillRequest
} from '../controllers/pantryController.js';

const router = express.Router();

router.post('/', addToPantry);
router.get('/user/:userId', getUserPantry);
router.put('/:id', updatePantryItem);
router.get('/shop/:shopId/requests', getShopRefillRequests);
router.put('/request/:id/confirm', confirmRefillRequest);

export default router;

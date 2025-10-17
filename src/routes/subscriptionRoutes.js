import express from 'express';
import {
  subscribeToShop,
  unsubscribeFromShop,
  getUserSubscriptions,
  getShopSubscribers,
  checkSubscription
} from '../controllers/subscriptionController.js';

const router = express.Router();

// Subscribe to a shop
router.post('/subscribe', subscribeToShop);

// Unsubscribe from a shop
router.post('/unsubscribe', unsubscribeFromShop);

// Get user's subscriptions
router.get('/user/:userId', getUserSubscriptions);

// Get shop's subscribers
router.get('/shop/:shopId', getShopSubscribers);

// Check if user is subscribed to a shop
router.get('/check/:userId/:shopId', checkSubscription);

export default router;

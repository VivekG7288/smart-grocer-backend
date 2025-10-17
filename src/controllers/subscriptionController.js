import Subscription from '../models/Subscription.js';

// Subscribe to a shop
export const subscribeToShop = async (req, res) => {
  try {
    const { userId, shopId } = req.body;
    
    // Check if subscription already exists
    const existingSubscription = await Subscription.findOne({ userId, shopId });
    if (existingSubscription) {
      if (existingSubscription.isActive) {
        return res.status(400).json({ error: 'Already subscribed to this shop' });
      } else {
        // Reactivate subscription
        existingSubscription.isActive = true;
        await existingSubscription.save();
        return res.json(existingSubscription);
      }
    }
    
    const subscription = new Subscription({ userId, shopId });
    await subscription.save();
    
    // Populate the response with shop details
    await subscription.populate('shopId', 'name address phone');
    
    res.status(201).json(subscription);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Unsubscribe from a shop
export const unsubscribeFromShop = async (req, res) => {
  try {
    const { userId, shopId } = req.body;
    
    const subscription = await Subscription.findOne({ userId, shopId });
    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }
    
    subscription.isActive = false;
    await subscription.save();
    
    res.json({ message: 'Unsubscribed successfully' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Get user's subscriptions
export const getUserSubscriptions = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const subscriptions = await Subscription.find({ 
      userId, 
      isActive: true 
    }).populate('shopId', 'name address phone ownerId');
    
    res.json(subscriptions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get shop's subscribers
export const getShopSubscribers = async (req, res) => {
  try {
    const { shopId } = req.params;
    
    const subscriptions = await Subscription.find({ 
      shopId, 
      isActive: true 
    }).populate('userId', 'name email address');
    
    res.json(subscriptions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Check if user is subscribed to a shop
export const checkSubscription = async (req, res) => {
  try {
    const { userId, shopId } = req.params;
    
    const subscription = await Subscription.findOne({ 
      userId, 
      shopId, 
      isActive: true 
    });
    
    res.json({ isSubscribed: !!subscription });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

import Razorpay from 'razorpay';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { createShopRecord } from './shopController.js';

dotenv.config(); // ensures env vars are loaded even if this file is imported before server.js

// Validate env vars
const key_id = process.env.RAZORPAY_KEY_ID;
const key_secret = process.env.RAZORPAY_KEY_SECRET;

if (!key_id || !key_secret) {
  console.error('⚠️ Razorpay configuration missing. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env');
}

export const createOrder = async (req, res) => {
  try {
    if (!key_id || !key_secret) {
      return res.status(500).json({
        success: false,
        error: 'Payment gateway not configured. Please contact support.'
      });
    }

    // ✅ Initialize Razorpay only when needed and keys are valid
    const razorpay = new Razorpay({ key_id, key_secret });

    const amountRupees = parseInt(req.body.amount || process.env.SHOP_REGISTRATION_FEE || '500', 10);
    const amount = amountRupees * 100;

    const options = {
      amount,
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
      payment_capture: 1
    };

    const order = await razorpay.orders.create(options);
    return res.json({ success: true, order, key: key_id });
  } catch (err) {
    console.error('createOrder error', err);
    return res.status(500).json({ success: false, error: 'Unable to create order' });
  }
};

export const verifyPayment = async (req, res) => {
  try {
    if (!key_id || !key_secret) {
      return res.status(500).json({
        success: false,
        error: 'Payment gateway not configured. Please contact support.'
      });
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, metadata } = req.body;

    const expectedSignature = crypto
      .createHmac('sha256', key_secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, error: 'Invalid signature' });
    }

    if (metadata && metadata.pendingShop) {
      try {
        const pending = metadata.pendingShop;
        const createdShop = await createShopRecord({
          ownerId: pending.ownerId,
          name: pending.name,
          phone: pending.phone,
          address: pending.address,
          deliveryRadius: pending.deliveryRadius
        });

        return res.json({ success: true, message: 'Payment verified and shop created', shop: createdShop });
      } catch (err) {
        console.error('Error creating shop after payment:', err);
        return res.status(500).json({ success: false, error: 'Payment verified but failed to create shop', details: err.message });
      }
    }

    return res.json({ success: true, message: 'Payment verified' });
  } catch (err) {
    console.error('verifyPayment error', err);
    return res.status(500).json({ success: false, error: 'Verification failed' });
  }
};

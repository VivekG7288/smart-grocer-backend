import express from 'express';
import {
  getUserAddresses,
  saveAddress,
  updateLastUsed
} from '../controllers/addressController.js';

const router = express.Router();

router.get('/user/:userId', getUserAddresses);
router.post('/', saveAddress);
router.put('/:id/use', updateLastUsed);

export default router;

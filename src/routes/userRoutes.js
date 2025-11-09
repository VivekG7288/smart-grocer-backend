import express from 'express';
import {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  saveOneSignalId,
} from '../controllers/userController.js';

const router = express.Router();

// Create a new user
router.post('/', createUser);

// Get all users
router.get('/', getUsers);

// Get a single user by ID
router.get('/:id', getUserById);

// Update a user by ID
router.put('/:id', updateUser);

// Delete a user by ID
router.delete('/:id', deleteUser);

// Save OneSignal player id for current user (body: { userId, playerId })
router.post('/onesignal', saveOneSignalId);

export default router;

// src/controllers/authController.js (Simplified version)
import User from '../models/User.js';

export const register = async (req, res) => {
  try {
    const { name, email, password, role, address } = req.body;
    const user = new User({ name, email, password, role, address });
    await user.save();
    res.status(201).json({ 
      _id: user._id, 
      name: user.name, 
      email: user.email, 
      role: user.role, 
      address: user.address 
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    
    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });
    
    res.json({ 
      _id: user._id, 
      name: user.name, 
      email: user.email, 
      role: user.role, 
      address: user.address 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

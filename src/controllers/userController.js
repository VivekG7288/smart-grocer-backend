import User from "../models/User.js";

// Create new user
export const createUser = async (req, res) => {
    try {
        const user = new User(req.body);
        await user.save();
        res.status(201).json(user);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// Get all users
export const getUsers = async (req, res) => {
    try {
        const users = await User.find();
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get user by ID
export const getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ error: "User not found" });
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Update user
export const updateUser = async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
        });
        if (!user) return res.status(404).json({ error: "User not found" });
        res.json(user);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// Delete user
export const deleteUser = async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        res.status(204).end();
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Save Firebase FCM token for a user
export const saveFCMToken = async (req, res) => {
    try {
        const { userId, token } = req.body;
        if (!userId || !token)
            return res
                .status(400)
                .json({ error: "userId and token are required" });

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ error: "User not found" });

        // Ensure array exists
        if (!user.fcmTokens) user.fcmTokens = [];

        // STEP 1: Clean duplicates
        user.fcmTokens = [...new Set(user.fcmTokens)];

        // STEP 2: Only keep last 1 or 2 tokens (browser refresh safety)
        if (user.fcmTokens.length > 2) {
            user.fcmTokens = user.fcmTokens.slice(-2); // keep last 2
        }

        // STEP 3: Add new token ONLY IF unique
        if (!user.fcmTokens.includes(token)) {
            user.fcmTokens.push(token);
            user.fcmTokens = [...new Set(user.fcmTokens)];
        }

        await user.save();

        res.json({ message: "FCM token saved", tokens: user.fcmTokens });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

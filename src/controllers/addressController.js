import Address from '../models/Address.js';
import { geocodeAddress } from '../utils/locationService.js';

// Get user's saved addresses
export const getUserAddresses = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const addresses = await Address.find({ userId })
      .sort({ lastUsed: -1 }) // Most recently used first
      .limit(10);
    
    res.json(addresses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Save new address
export const saveAddress = async (req, res) => {
  try {
    const { userId, label, flat, building, street, area, landmark, city, pincode, isDefault } = req.body;
    
    // Geocode the address
    const fullAddress = `${flat} ${building} ${street} ${area} ${city} ${pincode}`.trim();
    let locationData;
    try {
      locationData = await geocodeAddress(fullAddress);
    } catch (geocodeError) {
      console.warn('Geocoding failed, saving without coordinates:', geocodeError.message);
      locationData = {
        coordinates: [],
        formattedAddress: fullAddress
      };
    }
    
    // If this is set as default, remove default from other addresses
    if (isDefault) {
      await Address.updateMany({ userId }, { isDefault: false });
    }
    
    const address = new Address({
      userId,
      label,
      flat,
      building,
      street,
      area,
      landmark,
      city,
      pincode,
      coordinates: locationData.coordinates,
      formattedAddress: locationData.formattedAddress || fullAddress,
      isDefault,
      lastUsed: new Date()
    });
    
    await address.save();
    res.status(201).json(address);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Update address last used
export const updateLastUsed = async (req, res) => {
  try {
    const { id } = req.params;
    
    const address = await Address.findByIdAndUpdate(
      id,
      { lastUsed: new Date() },
      { new: true }
    );
    
    if (!address) {
      return res.status(404).json({ error: 'Address not found' });
    }
    
    res.json(address);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

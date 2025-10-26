import Shop from "../models/Shop.js";
import axios from "axios";

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

// Geocoding function
const geocodeAddress = async (address) => {
    try {
        console.log("Geocoding address:", address);

        const response = await axios.get(
            "https://maps.googleapis.com/maps/api/geocode/json",
            {
                params: {
                    address: address,
                    key: GOOGLE_MAPS_API_KEY,
                    region: "in",
                },
            }
        );

        console.log("Geocoding response status:", response.data.status);
        console.log("Geocoding results:", response.data.results);

        if (response.data.status === "OK" && response.data.results.length > 0) {
            const result = response.data.results[0];
            const location = result.geometry.location;

            // Extract address components
            const addressComponents = result.address_components;
            let city = "";
            let state = "";
            let pincode = "";
            let area = "";

            addressComponents.forEach((component) => {
                const types = component.types;
                if (types.includes("locality")) {
                    city = component.long_name;
                }
                if (
                    types.includes("sublocality_level_1") ||
                    types.includes("sublocality")
                ) {
                    area = component.long_name;
                }
                if (types.includes("administrative_area_level_1")) {
                    state = component.long_name;
                }
                if (types.includes("postal_code")) {
                    pincode = component.long_name;
                }
            });

            const locationData = {
                coordinates: [location.lng, location.lat],
                formattedAddress: result.formatted_address,
                city: city || "Unknown City",
                state: state || "Unknown State",
                pincode: pincode || "",
                area: area || "",
            };

            console.log("Processed location data:", locationData);
            return locationData;
        } else {
            throw new Error(
                `Geocoding failed: ${response.data.status} - ${
                    response.data.error_message || "Unknown error"
                }`
            );
        }
    } catch (error) {
        console.error("Geocoding error:", error);
        throw new Error("Failed to find address location: " + error.message);
    }
};

// Create new shop
export const createShop = async (req, res) => {
    try {
        const { ownerId, name, phone, address, deliveryRadius } = req.body;

        const created = await createShopRecord({
            ownerId,
            name,
            phone,
            address,
            deliveryRadius,
        });
        res.status(201).json(created);
    } catch (err) {
        console.error("Error creating shop:", err);
        res.status(400).json({
            error: "Failed to create shop: " + err.message,
            details: err.stack,
        });
    }
};

export const createShopRecord = async ({
    ownerId,
    name,
    phone,
    address,
    deliveryRadius,
}) => {
    if (!ownerId || !name || !address) {
        throw new Error("Owner ID, shop name, and address are required");
    }

    // Geocode the shop address
    let locationData;
    try {
        locationData = await geocodeAddress(address);
    } catch (geocodeError) {
        console.error("Geocoding failed:", geocodeError);
        throw new Error(
            "Unable to find location for this address. Please check the address and try again."
        );
    }

    const shop = new Shop({
        ownerId,
        name,
        phone: phone || "",
        location: {
            type: "Point",
            coordinates: locationData.coordinates,
            address: locationData.formattedAddress,
            city: locationData.city,
            state: locationData.state,
            pincode: locationData.pincode,
            area: locationData.area,
        },
        deliveryRadius: deliveryRadius || 5,
        isActive: true,
    });

    const savedShop = await shop.save();
    console.log("Shop saved successfully (createShopRecord):", savedShop);
    return savedShop;
};

// Get all shops
export const getShops = async (req, res) => {
    try {
        console.log("Getting all shops...");
        const shops = await Shop.find({ isActive: true }).populate(
            "ownerId",
            "name email"
        );
        console.log("Found shops:", shops.length);
        res.json(shops);
    } catch (err) {
        console.error("Error getting shops:", err);
        res.status(500).json({ error: err.message });
    }
};

export const getShopById = async (req, res) => {
    try {
        const shop = await Shop.findById(req.params.id).populate(
            "ownerId",
            "name email"
        );
        if (!shop) {
            return res.status(404).json({ error: "Shop not found" });
        }
        res.json(shop);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const updateShop = async (req, res) => {
    try {
        const shop = await Shop.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
        });
        if (!shop) {
            return res.status(404).json({ error: "Shop not found" });
        }
        res.json(shop);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

export const deleteShop = async (req, res) => {
    try {
        const shop = await Shop.findByIdAndUpdate(
            req.params.id,
            { isActive: false },
            { new: true }
        );
        if (!shop) {
            return res.status(404).json({ error: "Shop not found" });
        }
        res.json({ message: "Shop deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

import axios from "axios";

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

export const geocodeAddress = async (address) => {
    try {
        console.log("Geocoding address:", address);

        const response = await axios.get(
            "https://maps.googleapis.com/maps/api/geocode/json",
            {
                params: {
                    address: address,
                    key: GOOGLE_MAPS_API_KEY,
                    region: "in", // Bias towards India
                },
            }
        );

        console.log("Geocoding response:", response.data);

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
                coordinates: [location.lng, location.lat], // [longitude, latitude] - GeoJSON format
                formattedAddress: result.formatted_address,
                city: city || "Unknown City",
                state: state || "Unknown State",
                pincode: pincode || "",
                area: area || "",
            };

            console.log("Processed location data:", locationData);
            return locationData;
        } else {
            throw new Error(`Geocoding failed: ${response.data.status}`);
        }
    } catch (error) {
        console.error("Geocoding error:", error);
        throw new Error(
            "Failed to find address location. Please check the address and try again."
        );
    }
};

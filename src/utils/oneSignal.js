// src/utils/oneSignal.js
import axios from "axios";

const ONE_SIGNAL_API_URL = "https://onesignal.com/api/v1/notifications";

export async function sendPushNotification(userId, title, message) {
    try {
        const body = {
            app_id: process.env.ONESIGNAL_APP_ID,
            include_external_user_ids: [String(userId)], // MUST match OneSignal.login(userId)
            headings: { en: title },
            contents: { en: message },
            target_channel: "push",
            // data: { some: "extra-payload" },
        };

        const res = await axios.post(ONE_SIGNAL_API_URL, body, {
            headers: {
                "Content-Type": "application/json; charset=utf-8",
                // 👇 This is exactly what OneSignal expects for the v1 notifications API
                // https://documentation.onesignal.com/docs/keys-and-ids
                Authorization: `Basic ${process.env.ONESIGNAL_REST_API_KEY}`,
            },
        });

        console.log("✅ Push Notification Sent:", res.data);
    } catch (err) {
        if (err.response) {
            console.error("❌ Push Error status:", err.response.status);
            console.error("❌ Push Error data:", err.response.data);
        } else {
            console.error("❌ Push Error:", err.message);
        }
    }
}

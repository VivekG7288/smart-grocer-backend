import axios from 'axios';

const ONESIGNAL_APP_ID = process.env.ONESIGNAL_APP_ID;
const ONESIGNAL_REST_KEY = process.env.ONESIGNAL_REST_KEY;

if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_KEY) {
  console.warn('OneSignal keys are not configured (ONESIGNAL_APP_ID / ONESIGNAL_REST_KEY)');
}

/**
 * Send a OneSignal notification to specific player ids.
 * @param {string[]} playerIds
 * @param {string} title
 * @param {string} message
 * @param {object} data - optional extra data
 */
export async function sendNotification(playerIds = [], title = '', message = '', data = {}) {
  if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_KEY) {
    console.warn('Skipping sendNotification because OneSignal is not configured');
    return;
  }

  if (!Array.isArray(playerIds) || playerIds.length === 0) return;

  try {
    const payload = {
      app_id: ONESIGNAL_APP_ID,
      include_player_ids: playerIds,
      headings: { en: title },
      contents: { en: message },
      data: data || {},
      content_available: true,
    };

    const res = await axios.post('https://onesignal.com/api/v1/notifications', payload, {
      headers: {
        Authorization: `Basic ${ONESIGNAL_REST_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    return res.data;
  } catch (err) {
    console.error('OneSignal send error:', err.response?.data || err.message);
  }
}

export default { sendNotification };

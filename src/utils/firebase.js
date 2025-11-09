import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

// Verify required environment variables
const requiredEnvVars = [
  'FIREBASE_PROJECT_ID',
  'FIREBASE_PRIVATE_KEY',
  'FIREBASE_CLIENT_EMAIL'
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

// Log environment variables for debugging (exclude private key)
console.log('Firebase Config:', {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKeyId: process.env.FIREBASE_PRIVATE_KEY_ID
});

const serviceAccount = {
  type: "service_account",
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY,
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL
};

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

export const messaging = admin.messaging();

/**
 * Send a push notification using FCM
 * @param {string[]} tokens - FCM tokens to send to
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {Object} data - Optional data payload
 */
export async function sendNotification(tokens, title, body, data = {}) {
  if (!tokens || tokens.length === 0) {
    console.warn('No FCM tokens provided for notification');
    return;
  }

  try {
    const message = {
      notification: {
        title,
        body,
      },
      data: {
        ...data,
        click_action: 'FLUTTER_NOTIFICATION_CLICK',
      },
      tokens: Array.isArray(tokens) ? tokens : [tokens],
    };

    const response = await messaging.sendMulticast(message);
    console.log('Successfully sent message:', response);

    // Handle tokens that failed
    if (response.failureCount > 0) {
      const failedTokens = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          failedTokens.push(tokens[idx]);
        }
      });
      console.log('List of tokens that caused failures:', failedTokens);
      return failedTokens;
    }
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
}

export default { sendNotification };
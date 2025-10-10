// server/notifications.js
// Use 'import' since firebaseAdmin.js uses 'export default admin;'
import admin from './firebaseAdmin.js';

/**
 * Send push notification to a user
 * @param {string} token - User's FCM token
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {object} data - Optional additional data
 */
export async function sendNotification(token, title, body, data = {}) {
  if (!token) return;

  const message = {
    token,
    notification: { title, body },
    data: { ...data },
  };

  try {
    const response = await admin.messaging().send(message);
    console.log('Notification sent:', response);
  } catch (error) {
    console.error('Error sending notification:', error);
  }
}

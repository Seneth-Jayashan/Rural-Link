// server/notifications.js
import admin from './firebaseAdmin.js'

/**
 * Send push notification to one or multiple tokens
 * @param {string|string[]} tokens - Single token or array of tokens
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {object} data - Optional additional data
 */
export async function sendNotification(tokens, title, body, data = {}) {
  if (!tokens) return

  // Ensure we have an array
  const tokenList = Array.isArray(tokens) ? tokens : [tokens]

  const message = {
    notification: { title, body },
    data: { ...data },
  }

  try {
    const response = await admin.messaging().sendEachForMulticast({
      tokens: tokenList,
      ...message,
    })

    // Optional logging
    console.log(
      `✅ Notifications sent: ${response.successCount}, failed: ${response.failureCount}, tokens : ${tokenList}, title ${title}`
    )

    if (response.failureCount > 0) {
      console.warn('Failed tokens:', response.responses
        .filter(r => !r.success)
        .map((r, i) => tokenList[i]))
    }
  } catch (error) {
    console.error('❌ Error sending notification:', error)
  }
}

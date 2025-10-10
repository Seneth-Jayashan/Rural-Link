// src/notifications.js
import { messaging, getToken, onMessage } from "./firebase";

export async function requestNotificationPermission() {
  console.log("Requesting notification permission...");

  try {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      console.log("Notification permission granted.");

      // Replace with your Firebase → Cloud Messaging → Web Push Certificate public key
      const vapidKey = "BMCyP1ieGuBcqdJY8E9M_bD0fC-EBBOFAJjl-lRAFm9JRkWBNytTVW94_kH4g8BNuRB6aIqx_KaNXEpOrwS6O4E";

      const token = await getToken(messaging, { vapidKey });
      console.log("FCM Token:", token);

      // Optionally send token to your backend
      return token;
    } else {
      console.log("Notification permission denied.");
    }
  } catch (error) {
    console.error("Error getting notification permission:", error);
  }
}

// 🔥 Handle foreground notifications
export function listenForMessages() {
  onMessage(messaging, (payload) => {
    console.log("Message received in foreground: ", payload);
    const { title, body } = payload.notification;
    new Notification(title, { body });
  });
}

// Save token to backend
export async function saveTokenToDatabase(token, userId) {
  try {
    await fetch("/api/auth/update-fcm-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, userId }),
    });
    console.log("Token saved to database.");
  } catch (err) {
    console.error("Error saving token:", err);
  }
}
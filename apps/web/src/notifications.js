// src/notifications.js
import { messaging, getToken, onMessage } from "./firebase";
import { get, put, post, API_BASE } from './shared/api.js'

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
      sessionStorage.setItem('FCM-Token',token);

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

export async function saveFCMToken(token){
  try{
    const response = await put('/api/auth/update/fcm-token',{token});
    console.log("FCM Token Saved", response);
    return response
  }catch(error){
    console.error("Error saving fcm notification:", error);
  }
}

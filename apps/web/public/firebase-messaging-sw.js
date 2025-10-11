// public/firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyCAMFCaO7333x39veM5Z-Fid-LrFaLqSzA",
  authDomain: "rural-link.firebaseapp.com",
  projectId: "rural-link",
  storageBucket: "rural-link.firebasestorage.app",
  messagingSenderId: "313677285859",
  appId: "1:313677285859:web:cb3486325304f4707df8d6",
  measurementId: "G-1B0XWFCT9K"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message', payload);
  const { title, body } = payload.notification;
  self.registration.showNotification(title, { body });
});
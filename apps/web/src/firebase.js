// src/firebase.js
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: "AIzaSyCAMFCaO7333x39veM5Z-Fid-LrFaLqSzA",
  authDomain: "rural-link.firebaseapp.com",
  projectId: "rural-link",
  storageBucket: "rural-link.firebasestorage.app",
  messagingSenderId: "313677285859",
  appId: "1:313677285859:web:cb3486325304f4707df8d6",
  measurementId: "G-1B0XWFCT9K"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

export { messaging, getToken, onMessage };
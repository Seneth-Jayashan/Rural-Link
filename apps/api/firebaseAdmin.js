// firebaseAdmin.js
import dotenv from 'dotenv';
import admin from 'firebase-admin';

dotenv.config(); // Load .env

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

export default admin;

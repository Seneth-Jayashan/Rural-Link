// firebaseAdmin.js
import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

// 1. Parse the service account JSON (this object currently lacks the private_key field)
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);

// 2. Get the private key string separately from the dedicated env variable.
// We must replace the literal '\n' string loaded by dotenv with a real newline '\n' 
// to make it a valid PEM format.
const rawPrivateKey = process.env.FIREBASE_PRIVATE_KEY;
const formattedPrivateKey = rawPrivateKey.replace(/\\n/g, '\n');

// 3. Inject the correctly formatted private key into the serviceAccount object.
// The Firebase Admin SDK expects the private key to be here.
serviceAccount.private_key = formattedPrivateKey;

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

export default admin;
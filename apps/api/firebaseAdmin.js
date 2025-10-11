// firebaseAdmin.js
import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

// 1. Parse the service account JSON
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);

// 2. Get the raw private key
let formattedPrivateKey = process.env.FIREBASE_PRIVATE_KEY;

// DIAGNOSTIC STEP: Check if the key needs replacement.
// A real newline character has length 1. The literal string '\n' has length 2.
if (formattedPrivateKey.includes('\\n')) {
    console.log("Diagnostic: Replacing escaped newlines...");
    formattedPrivateKey = formattedPrivateKey.replace(/\\n/g, '\n');
} else {
    console.log("Diagnostic: Private key appears to be loaded with real newlines. Skipping replacement.");
}

// 3. Inject the formatted key
serviceAccount.private_key = formattedPrivateKey;

// DIAGNOSTIC STEP: Check the final key length/content (Optional but helpful)
// console.log("Final Private Key (First 50 chars):", formattedPrivateKey.substring(0, 50));
// console.log("Final Private Key (Last 50 chars):", formattedPrivateKey.slice(-50));


admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

export default admin;
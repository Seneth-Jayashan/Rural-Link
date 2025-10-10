require('dotenv').config()
const admin = require('firebase-admin')

// Convert the literal \n in private_key to actual newlines
const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON.replace(/\\n/g, '\n')

admin.initializeApp({
  credential: admin.credential.cert(JSON.parse(serviceAccountJson))
})

module.exports = admin

// server/firebaseAdmin.js
const admin = require('firebase-admin')
const serviceAccount = require('./serviceAccountKey.json') // your Firebase service account JSON

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
})

module.exports = admin

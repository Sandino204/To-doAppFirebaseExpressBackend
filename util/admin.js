const admin = require('firebase-admin')

const adminFirebase = require('../config/adminFirebase')

admin.initializeApp(adminFirebase)

const db = admin.firestore()

module.exports = {admin, db}
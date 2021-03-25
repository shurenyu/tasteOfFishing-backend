const admin = require("firebase-admin");
const serviceAccount = require("../../fishing-1140f-firebase-adminsdk-59wb3-12e96c3b0a.json");

admin.initializeApp({
    // credential: admin.credential.applicationDefault(),
    credential: admin.credential.cert(serviceAccount),
})

module.exports.admin = admin;


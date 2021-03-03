const config = require("../../config/firebase.config");

exports.sendNotification = (message) => {
	config.admin.messaging().sendMulticast(message).then(response => {
		return console.log("Notification sent successfully");
	}).catch(err => {
		return console.log(err.toString());
	})
}

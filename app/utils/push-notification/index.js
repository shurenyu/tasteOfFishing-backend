const config = require("../../config/firebase.config");
const db = require("../../models");
const PushToken = db.pushToken;

exports.sendNotification = (tokens, message) => {
	config.admin.messaging().sendMulticast({
		tokens,
		data: {message: message}
	}).then(response => {
		return console.log("Notification sent successfully");
	}).catch(err => {
		return console.log(err.toString());
	})
}

exports.getAllTokens = async () => {
	return await PushToken.findAll({
		limit: 500
	});
}

exports.getSubTokens = async (userIds) => {
	return await PushToken.findAll({
		limit: 500,
		where: {
			userId: userIds,
		}
	});
}

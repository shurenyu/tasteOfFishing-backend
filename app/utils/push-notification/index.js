// const config = require("../../config/firebase.config");
const config = require("../../config/auth.config")
const db = require("../../models");
const PushToken = db.pushToken;
const fetch = require('node-fetch');

// exports.sendNotification = (tokens, sendData) => {
// 	config.admin.messaging().sendMulticast({
// 		tokens,
// 		data: sendData
// 	}).then(response => {
// 		return console.log("Notification sent successfully");
// 	}).catch(err => {
// 		return console.log(err.toString());
// 	})
// }



exports.sendNotification = async (tokens, data) => {
	let token_array  = [...new Set(tokens)];
	// notification object with title and text
	const notification = {
		clickAction: 'FISHING_TASTE_CLICK_ACTION',
		title: data.title,
		body: data.message,
		data: data.data,
	};

	// fcm device tokens array
	const notification_body = {
		'notification': notification,
		'registration_ids': token_array,
	};

	fetch('https://fcm.googleapis.com/fcm/send', {
		'method': 'POST',
		'headers': {
			// replace authorization key with your key
			'Authorization': 'key=' + config.PUSH_API_KEY,
			'Content-Type': 'application/json'
		},
		'body': JSON.stringify(notification_body)
	}).then(async function (response) {
		console.log('success');
	}).catch(function (error) {
		console.error(error);
	})
};


exports.getAllTokens = async () => {
	const temp =  await PushToken.findAll({
		limit: 500
	});

	return temp.map(x => (x.token));
}

exports.getSubTokens = async (userIds) => {
	return await PushToken.findAll({
		limit: 500,
		where: {
			userId: userIds,
		}
	});
}

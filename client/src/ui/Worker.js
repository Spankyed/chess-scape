"use strict";
// https://serviceworke.rs/push-clients_service-worker_doc.html

self.addEventListener("push", function (event) {
	const data = event.data?.json();
	const title = "You Have Been Challenged";
	const body = `${data?.oppName} wishes to play you in a match.`;

	console.log("[Service Worker] Push Received: ", { data });

	const options = {
		body,
		data,
		icon: "assets/brand/logo.png",
		// badge: "img/img2.png",
		tag: 'chess-scape-notification'
	};

	event.waitUntil(self.registration.showNotification(title, options));
});


self.addEventListener("notificationclick", function (event) {
	// console.log("Notification clicked", {
	// 	event,
	// 	notification: event.notification,
	// });

	event.notification.close(); // Android doesn't close the notification when you click on it : http://crbug.com/463146

	const { roomID } = event.notification.data || {};
	const queryString = `?roomID=${roomID}`
	
	self.clients.openWindow("/" + queryString);

	// self.clients.matchAll().then(function (clientList) {
	// 	if (clientList.length > 0) {
	// 		return clientList[0].focus();
	// 	}

	// 	return self.clients.openWindow("../push-clients_demo.html");
	// });
});


// https://developers.google.com/web/updates/2015/03/push-notifications-on-the-open-web#unsubscribe_a_users_device
import Api from "../../api/Api";
import { delay } from "nanodelay";

async function subscribe() {
	let sw = await navigator.serviceWorker.ready;
	// todo fetch applicationServerKey from server
	let subscription = await sw.pushManager.subscribe({
		userVisibleOnly: true,
		applicationServerKey:
			"BBJafaF1VhnJwgSDHHHht9y7wqdkEMW8lBN0P4fcWMItTq73plMLt3jE6P12GQsC5tV5WhK6qwsLpP-n2Z0XSHQ",
	});
	let res = (await Api.pushSubscribe(subscription)) || {};
	return { message: `Push subscribed [${JSON.stringify(res.subscription)}]` };
}

async function setuser({ actions, args }) {
	const [clientID, TOKEN] = args;
	const client = { clientID, TOKEN };
	localStorage.clear();
	Api.closeConnection();
	actions.unauthorize();
	localStorage.setItem("client", JSON.stringify(client));
	delay(200).then(_ => {
		Api.setClient(client);
		actions.authorize();
	});
	return { message: `User set [${clientID}]:[${TOKEN}]` };
}

export default {
	setuser,
	subscribe,
};

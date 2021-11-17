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
	localStorage.clear();
	Api.isConnected() && Api.closeConnection();
	actions.unauthorize();
	const [clientID, TOKEN] = args;
	const client = { clientID, TOKEN };
	localStorage.setItem("client", JSON.stringify(client));
	const username = await Api.adminSetClient(client);
	delay(200).then(actions.authorize)
	return { message: `User set [${username}]:[${clientID}]` };
}

async function deleteroom({ state, args }) {
	const [idx] = args;
	const { rooms } = state.lobby;
	await Api.deleteRoom(rooms[idx]?.ID);
	return { message: `Room deleted [${idx}]:[${rooms[idx].ID}]` };
}

export default {
	setuser,
	subscribe,
	deleteroom,
};

import Api from "../../api/Api";
import { delay } from "nanodelay";

async function subscribe() {
	let [sw, applicationServerKey] = await Promise.all([
		navigator.serviceWorker.ready,
		Api.getPushKey(),
	]);
	let subscription = await sw.pushManager.subscribe({
		userVisibleOnly: true,
		applicationServerKey,
	});
	let res = (await Api.pushSubscribe(subscription)) || {};
	return { message: `Push subscribed [${JSON.stringify(res.subscription)}]` };
}

async function setuser({ state, actions, args }) {
	localStorage.clear();
	if (state.isAuthorized || Api.isConnected()) {
		Api.closeConnection();
		actions.unauthorize();
	}
	const [clientID, TOKEN] = args;
	const client = { clientID, TOKEN };
	localStorage.setItem("client", JSON.stringify(client));
	const username = await Api.adminSetUser(client);
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

import Api from "../../api/Api";

async function setUser({ actions, args }) {
	const [ clientID, TOKEN ] = args;
	const client = { clientID, TOKEN };
	localStorage.setItem("client", JSON.stringify(client));
	Api.setClient(client);
	actions.authorize();
	return {message: `User set [${clientID}]:[${TOKEN}]`}
}

// function subscribe() {}

export default {
	setUser,
};

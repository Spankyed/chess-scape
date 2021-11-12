import { h } from 'hyperapp';
import { app } from 'hyperapp'; 
import Api from '../api/Api';
// import { withLogger } from "@hyperapp/logger";

import Admin from "./Admin/Admin";
import Entrance from './Entrance/Entrance';
import GameRoom from './GameRoom/Room';
import Lobby from './Lobby/Lobby';
import './index.scss';

const admin = Admin()
const entrance = Entrance()
const gameRoom = GameRoom()
const lobby = Lobby()

const initialState = {
	admin: admin.state,
	entrance: entrance.state,
	gameRoom: gameRoom.state,
	lobby: lobby.state,
	isAuthorized: false,
	inGame: false,
	roomID: "",
};

const state = {
	...initialState,
	isAuthorized: checkForClient(),
};

const actions = {
	admin: admin.actions,
	entrance: entrance.actions,
	gameRoom: gameRoom.actions,
	lobby: lobby.actions,
	authorize: () => ({ isAuthorized: true }),
	unauthorize: () => ({ ...initialState }),
	joinRoom: (roomID) => ({ inGame: true, roomID }),
	joinLobby: () => ({ inGame: false }), // back to lobby
};

const view = (state, actions) => {
	const AdminView = admin.view(state.admin, actions.admin);
	const EntranceView = entrance.view(state.entrance, actions.entrance);
	const GameRoomView = gameRoom.view(state.gameRoom, actions.gameRoom);
	const LobbyView = lobby.view(state.lobby, actions.lobby);

	function init(){
		Api.setMessageHandlers({
			unauthorize: () => {
				Api.closeConnection()
				actions.unauthorize();
				localStorage.clear();
			},
		});
	}
	return (
		<div oncreate={init} class="app">
			<AdminView {...state} {...{actions}} />

			{!state.isAuthorized ? (
				<EntranceView authorize={actions.authorize} />
			) : state.inGame ? (
				<GameRoomView
					roomID={state.roomID}
					joinLobby={actions.joinLobby}
				/>
			) : (
				<LobbyView joinRoom={actions.joinRoom} />
			)}
		</div>
	);
};

export default app(state, actions, view, document.body); // withLogger(app)(state, actions, view, document.body);

function checkForClient() {
	const client = localStorage.getItem("client");
	const info = JSON.parse(client || '""');
	return info.TOKEN && info.clientID;
}
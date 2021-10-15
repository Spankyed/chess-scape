import { h } from 'hyperapp';
import { app } from 'hyperapp'; 
import Api from '../api/Api';
// import { withLogger } from "@hyperapp/logger";

import Entrance from './Entrance/Entrance';
import GameRoom from './GameRoom/Room';
import Lobby from './Lobby/Lobby';
import './index.scss';

const entrance = Entrance()
const gameRoom = GameRoom()
const lobby = Lobby()

const initialState = {
	entrance: entrance.state,
	gameRoom: gameRoom.state,
	lobby: lobby.state,
	authorized: false,
	inGame: false,
	roomID: "",
};

const state = {
	...initialState,
	authorized: checkForClient(),
};

const actions = {
	entrance: entrance.actions,
	gameRoom: gameRoom.actions,
	lobby: lobby.actions,
	authorize: () => ({ authorized: true }),
	unauthorize: () => ({ ...initialState }),
	joinRoom: (roomID) => ({ inGame: true, roomID }),
	joinLobby: () => ({ inGame: false }), // back to lobby
};

const view = (state, actions) => {
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
		<div oncreate={init} class="h-full">
			{/* {false ? ( */}
			{!state.authorized ? (
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
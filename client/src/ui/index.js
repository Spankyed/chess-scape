import { h } from 'hyperapp';
import { app } from 'hyperapp'; 
import Api from '../api/Api';
// import { withLogger } from "@hyperapp/logger";

import Entrance from './Entrance/Entrance';
import GameRoom from './GameRoom/GameRoom';
import Lobby from './Lobby/Lobby';
import './index.scss';

const entrance = Entrance()
const gameRoom = GameRoom()
const lobby = Lobby()

const state = {
	entrance: entrance.state,
	gameRoom: gameRoom.state,
	lobby: lobby.state,
	authorized: checkForClient(),
	inGame: false,
	roomID: "",
};

const actions = {
	entrance: entrance.actions,
	gameRoom: gameRoom.actions,
	lobby: lobby.actions,
	authorize: () => ({ authorized: true }),
	unauthorize: () => ({authorized: false}),
	joinGame: (roomID) => ({ inGame: true, roomID }),
	leaveGame: () => ({ inGame: false }), // back to lobby
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
					leaveGame={actions.leaveGame}
				/>
			) : (
				<LobbyView joinGame={actions.joinGame} />
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
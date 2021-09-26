import { h } from 'hyperapp';
import { app } from 'hyperapp'; 
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
	gameId: "",
};

const actions = {
	entrance: entrance.actions,
	gameRoom: gameRoom.actions,
	lobby: lobby.actions,
	authorize: () => ({ authorized: true }),
	// unauthorize: () => ({authorized: false}),
	joinGame: (gameId) => ({ inGame: true, gameId }),
	leaveGame: () => ({ inGame: false }),
};

const view = (state, actions) => {
	const EntranceView = entrance.view(state.entrance, actions.entrance);
	const GameRoomView = gameRoom.view(state.gameRoom, actions.gameRoom);
	const LobbyView = lobby.view(state.lobby, actions.lobby);

	return (
		<div class="h-full">
			{/* {true ? ( */}
			{!state.authorized ? (
				<EntranceView authorize={actions.authorize} />
			) : state.inGame ? (
				<GameRoomView
					gameId={state.gameId}
					leaveGame={actions.leaveGame}
				/>
			) : (
				<LobbyView joinGame={actions.joinGame} />
			)}
		</div>
	);
};

// export const App = app(state, actions, view, document.body); //withLogger(app)(state, actions, view, document.body);
export default app(state, actions, view, document.body);

function checkForClient() {
	const client = localStorage.getItem("client");
	const info = JSON.parse(client || '""');
	return info.TOKEN && info.clientId;
}
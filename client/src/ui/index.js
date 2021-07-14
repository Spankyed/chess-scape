import { h } from 'hyperapp';
import { app } from 'hyperapp'; 
// import { withLogger } from "@hyperapp/logger";

import Lobby from './Lobby/Lobby';
import GameRoom from './GameRoom/GameRoom';
import './index.scss';

const lobby = Lobby()
const gameRoom = GameRoom()

const state = {
    lobby: lobby.state,
    gameRoom: gameRoom.state,
    inGame: false,
	gameId: '',
}

const actions = {
    lobby: lobby.actions,
    gameRoom: gameRoom.actions,
    joinGame: (gameId) => ({ inGame: true, gameId }),
    leaveGame: () => ({ inGame: false  })
}

const view = ( state, actions ) => {
	const LobbyView = lobby.view(state.lobby, actions.lobby)
	const GameRoomView = gameRoom.view(state.gameRoom, actions.gameRoom)

	return (
		<div class="">
			{	!state.inGame ?
				<LobbyView joinGame={actions.joinGame}/>  :
				<GameRoomView gameId={state.gameId} leaveGame={actions.leaveGame}/>  
			}
		</div>
	)
}

// export const App = app(state, actions, view, document.body); //withLogger(app)(state, actions, view, document.body);
export default app(state, actions, view, document.body)

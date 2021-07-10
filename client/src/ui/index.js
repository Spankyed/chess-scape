import { h } from 'hyperapp';
import { app } from 'hyperapp'; 
// import { withLogger } from "@hyperapp/logger";

import Lobby from './Lobby/Lobby';
import GameRoom from './GameRoom/GameRoom';
import './index.css';

const lobby = Lobby()
const gameRoom = GameRoom()

const state = {
    lobby: lobby.state,
    gameRoom: gameRoom.state,
    inGame: true
}

const actions = {
    lobby: lobby.actions,
    gameRoom: gameRoom.actions,
    // authorize: () => ({authorized: true}),
    unauthorize: () => ({ inGame: false  })
}

const view = ( state, actions ) => {
	const LobbyView = lobby.view(state.lobby, actions.lobby)
	const GameRoomView = gameRoom.view(state.gameRoom, actions.gameRoom)

	return (
		<div class="container">
			{	!state.inGame ?
				<LobbyView/>  :
				<GameRoomView unauthorize={ actions.unauthorize }/>  
			}
		</div>
	)
}


// export const App = app(state, actions, view, document.body); //withLogger(app)(state, actions, view, document.body);
export default app(state, actions, view, document.body)

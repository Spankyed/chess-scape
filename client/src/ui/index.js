import { h } from 'hyperapp';
import { app } from 'hyperapp'; 
// import { withLogger } from "@hyperapp/logger";

import Lobby from './Lobby/Lobby';
import GameRoom from './GameRoom/';
import './index.scss';

const lobby = Lobby()
const gameRoom = GameRoom()

const state = {
    lobby: lobby.state,
    gameRoom: gameRoom.state,
    inGame: false
}

const actions = {
    lobby: lobby.actions,
    gameRoom: gameRoom.actions,
    joinGame: () => ({ inGame: true  }),
    leaveGame: () => ({ inGame: false  })
}

const view = ( state, actions ) => {
	const LobbyView = lobby.view(state.lobby, actions.lobby)
	const GameRoomView = gameRoom.view(state.gameRoom, actions.gameRoom)

	return (
		<div class="">
			{	!state.inGame ?
				<LobbyView/>  :
				<GameRoomView leaveGame={ actions.leaveGame }/>  
			}
		</div>
	)
}

// export const App = app(state, actions, view, document.body); //withLogger(app)(state, actions, view, document.body);
export default app(state, actions, view, document.body)

import { h } from 'hyperapp';
// import Chat from './Chat'; 
import Scene from './scene.js';

// todo: if in game and websocket disconnects, reconnect 
// todo: if leave game remove clientId from game.clients 
export default initial => ({
	state: { 
		loading: true,
		chatting: false
	},

	actions: { 
	},

	view: (state, actions) => ({gameId, leaveGame}) => {

		return ( 
			<div>
				<Scene gameId={gameId} state={state} actions={actions}></Scene> 
				{/* todo: on destroy, breakdown websocket and game */}
				{
					state.chatting ? <Chat state={state} actions={actions}></Chat> : ""
				}
			</div>
		)
	}
})

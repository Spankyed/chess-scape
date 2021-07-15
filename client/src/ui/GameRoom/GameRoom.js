import { h } from 'hyperapp';
// import Chat from './Chat'; 
import Loader from './loader/loader'; 
import Scene from './scene.js';

// todo: if in game and websocket disconnects, reconnect 
// todo: if leave game remove clientId from game.clients 
export default initial => ({
	state: { 
		isLoading: false,
		chatting: false
	},

	actions: { 
		hideLoadingUI: () => () => ({isLoading: false})
	},

	view: (state, actions) => ({gameId, leaveGame}) => {
		/* todo: on destroy, breakdown websocket and game */
		return ( 
			<div style="positon:relative;">
				{ state.isLoading && <Loader/> }
				<Scene gameId={gameId} state={state} actions={actions}></Scene> 
				{ state.chatting && <Chat state={state} actions={actions}></Chat> }
			</div>
		)
	}
})

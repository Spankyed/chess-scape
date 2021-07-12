import { h } from 'hyperapp';
// import Chat from './Chat'; 
import Scene from './scene.js';

// todo: if in game and websocket disconnects, reconnect 
export default initial => ({
	state: { 
		chatting: false
	},

	actions: { 
	},

	view: (state, actions) => ({leaveGame}) => {

		return ( 
			<div>
				<Scene state={state}></Scene> 
				{/* todo: on destroy, breakdown websocket and game */}
				{
					state.chatting ? <Chat state={state} actions={actions}></Chat> : ""
				}
			</div>
		)
	}
})

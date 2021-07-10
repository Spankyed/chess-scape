import { h } from 'hyperapp';
// import Chat from './Chat'; 
import Scene from '../../core/Scene';

// todo: if in game and websocket disconnects, reconnect 
export default initial => ({
	state: { 
		chatting: false
	},

	actions: { 
	},

	view: ({ chatting, empty, clips, timeline, inLobby }, actions) => ({authorize}) => {

		const init = (canvas) => {
			let gameId = 1
			Scene.setup(canvas, actions, gameId);
			canvas.focus();
		};

		return ( 
			<div>
				<canvas oncreate={init} id="renderCanvas"></canvas> 
				{/* todo: on destroy, breakdown websocket and game */}
				{
					chatting ? <Chat state={state} actions={actions}></Chat> : ""
				}
			</div>
		)
	}
})

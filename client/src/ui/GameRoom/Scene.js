import { h } from 'hyperapp';
import Scene from '../../core/Scene';

// todo: if in game and websocket disconnects, reconnect 
export default ({ chatting, empty, clips, timeline, inLobby }, actions) => {

	const init = (canvas) => {
		let gameId = 1
		Scene.setup(canvas, actions, gameId);
		canvas.focus();
	};
	
	return ( 
		<canvas oncreate={init} id="renderCanvas"></canvas> 
	)
};
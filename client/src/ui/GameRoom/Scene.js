import { h } from 'hyperapp';
import Scene from '../../core/Scene';

// todo: if in game and websocket disconnects, reconnect 
export default ({gameId, state, actions}) => {

	const init = (canvas) => {
		Scene.setupGame(canvas, actions, gameId);
		canvas.focus();
	};
	
	return ( 
		<canvas oncreate={init} id="renderCanvas"></canvas> 
	)
};
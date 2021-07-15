import { h } from 'hyperapp';
import Scene from '../../core/Scene';

// todo: if in game and websocket disconnects, reconnect 
export default ({gameId, state, actions}) => {

	const init = (canvas) => {
		setTimeout(()=> Scene.setupGame(canvas, actions, gameId) , 0)
		canvas.focus();
	};
	
	return ( 
		<canvas oncreate={init} id="renderCanvas"></canvas> 
	)
};
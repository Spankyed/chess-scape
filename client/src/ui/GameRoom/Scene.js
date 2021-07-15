import { h } from 'hyperapp';
import Scene from '../../core/Scene';

// todo: if in game and websocket disconnects, reconnect 
export default ({gameId, state, actions}) => {

	const init = (canvas) => {
		console.log('hash and  ass',window.location.hash)
		window.location.hash = `#${gameId}`
		setTimeout(()=> Scene.setupGame(canvas, actions, gameId) , 500)
		canvas.focus();
	};
	return ( 
		<canvas oncreate={init} id="renderCanvas"></canvas> 
	)
};
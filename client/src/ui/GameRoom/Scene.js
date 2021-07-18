import { h } from 'hyperapp';
import Scene from '../../core/Scene';

// todo: if in game and websocket disconnects, reconnect 
// todo: make sure scene & resizeObserver get disposed when component unmount

export default ({gameId, state, actions}) => {

	const init = (canvas) => {
		window.location.hash = `#${gameId}`
		setTimeout(()=> Scene.setupGame(canvas, actions, gameId) , 500)
		canvas.focus();
	};
	return ( 
		<canvas oncreate={init} id="renderCanvas"></canvas> 
	)
};
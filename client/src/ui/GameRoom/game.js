import { h } from 'hyperapp';
import Scene from '../../core/Scene';

// todo: if in game and websocket disconnects, reconnect 
// todo: make sure scene & resizeObserver get disposed when component unmount

export default ({roomID, state, actions}) => {

	const init = (canvas) => {
		window.location.hash = `#${roomID}`
		setTimeout(()=> Scene.setupGame(canvas, actions, roomID) , 500)
		canvas.focus();
	};
	return ( 
		<canvas oncreate={init} id="renderCanvas"></canvas> 
	)
};
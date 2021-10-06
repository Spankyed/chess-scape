import { h } from 'hyperapp';
import Scene from '../../core/Scene';
import Api from "../../api/Api"; 

// todo: if in game and websocket disconnects, reconnect 
// todo: make sure scene & resizeObserver get disposed when component unmount
export default (initial) => ({
	state: {
		ready: false,
	},
	actions: {
		readyUp: () => () => ({ ready: true }),
	},
	view:
		(state, actions) =>
		({ roomID, state, roomActions, clockActions }) => {
			const init = (canvas) => {
				// window.location.hash = `#${roomID}`; // todo use hash in lobby to redirect to room
				// Scene.onReady = () => {
        		// 	Api.readyUp();
					
				// }
				setTimeout(() => Scene.setupGame(canvas, roomActions, roomID), 500);
				canvas.focus();
			};
			return <canvas oncreate={init} id="renderCanvas"></canvas>;
		},
});


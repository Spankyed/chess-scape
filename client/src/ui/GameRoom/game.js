import { h } from 'hyperapp';
import Scene from '../../core/Scene';
import Api from "../../api/Api"; 

// todo: if in game and websocket disconnects, reconnect
// todo: make sure scene & resizeObserver get disposed when component unmount
export default (initial) => ({
	state: {
		player: false,
		playerColor: null,
		ready: false,
		// initialized: false,
		matchStarted: false,
	},
	actions: {
		setPlayer:
			({ player, playerColor }) =>
			() => ({ player, playerColor }),
		ready:
			() => ({ playerColor }) => {
				Api.ready(playerColor);
				return { ready: true };
			},
		startMatch: () => ({ player, playerColor }) => {
			// ! only transition moveMachine if is player
			if (player) Scene.board().moveService.send({
				type: "SET_PLAYER",
				value: {
					isPlayer: true,
					playerColor,
				},
			});
			return { matchStarted: true };
		}
	},
	view:
		(state, actions) =>
		({ roomID, roomState, roomActions, clockActions }) => {

			const move = (msg) => {
				// todo retrieve time left on each players clock &..
				// todo retrieve time msg sent and calc diff time now &...
				// todo adjust time left from time diff
				console.log("move msg", msg);
				// Scene.game().handleOpponentMove(msg.move);
			};

			if (state.player && !state.ready) {
				// ! only ready if player not spectator
				console.log(`Player ready [${state.playerColor}]`);
				actions.ready();
			}

			Api.setMessageHandlers({
				start: actions.startMatch,
				// move: Scene.game().handleOpponentMove,
			});

			const createScene = (canvas) => {
				// window.location.hash = `#${roomID}`; // todo use hash in lobby to redirect to room
				// Scene.onReady = () => {};
				setTimeout(_ => Scene.setupGame(canvas, roomActions, roomID), 500);
				canvas.focus();
			};

			return <canvas oncreate={createScene} id="renderCanvas"></canvas>;
		},
});


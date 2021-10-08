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
		setPlayer: ({ player, playerColor }) => () => ({ player, playerColor }),
		ready: () => ({ playerColor }) => {
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
		},
	},
	view:
		(state, actions) =>
		({ roomID, roomState, roomActions, clockActions }) => {
			const onMove = ({move, clientID, gameOver}) => {
				// todo retrieve time left on each players clock &..
				// todo retrieve time msg sent and calc diff time now &...
				// todo adjust time left from time diff
				if (clientID != Api.getClientID()) {
					Scene.game().handleOpponentMove(move);
				} 
				if (gameOver){
					// this.engine.reset()
       				// this.game_over = true
					// todo: if gameover indicate how: 'time/checkmate/3foldrep...'
					const info = { winningColor: 'white' || 'black', way: 'resign' || 'draw' || 'abandon'}
					roomActions.endGame(info)
				} 
			}
			const onAbort = ({gameOver})=>{
			}
			const onAbandon = ({gameOver})=>{
			}
			const onResign = ({gameOver})=>{
			}
			const onDrawOffer = ({})=>{
			}
			const onDraw = ({gameOver})=>{
			}
			const onSync = ({board})=>{
			}

			if (state.player && !state.ready) {
				// ! only ready if player not spectator
				// todo ready up player after camera animation
				console.log(`Player ready [${state.playerColor}]`);
				actions.ready();
			}

			Api.setMessageHandlers({
				start: actions.startMatch,
				move: onMove,
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


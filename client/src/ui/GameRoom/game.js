import { h } from 'hyperapp';
import { delay } from "nanodelay";
import Scene from '../../core/Scene';
import Api from "../../api/Api"; 
import { draw } from "./controls/prompts.js";

// todo: if in game and websocket disconnects, reconnect
// todo: make sure scene & resizeObserver get disposed when component unmount
export default (initial) => ({
	state: {
		player: false,
		playerColor: "white",
		ready: false,
		// initialized: false,
		matchStarted: false,
		committed: false,
	},
	actions: {
		setPlayer:
			({ player, playerColor }) =>
			(state) => {
				Scene.manager.animateCameraIntoPosition(
					playerColor || state.playerColor
				);
				Scene.game().playerColor = playerColor;
				return { player, playerColor };
			},
		ready:
			() =>
			({ playerColor }) => {
				Api.ready(playerColor);
				return { ready: true };
			},
		startMatch:
			() =>
			({ player, playerColor }) => {
				if (player)
					// ! only transition moveMachine if is player
					Scene.board().moveService.send({
						type: "SET_PLAYER",
						value: {
							isPlayer: true,
							playerColor,
						},
					});
				return { matchStarted: true };
			},
		finish: () => () => ({ finished: true }),
		commit: () => () => ({ committed: true }),
	},
	view:
		(state, actions) =>
		({ roomID, roomState, roomActions, clockActions }) => {
			const onSync = ({ moves }) => {
				Scene.board().syncBoard(moves);
				moves.forEach((move, idx) =>
					roomActions.sidePanel.moves.addMove({
						piece: move.piece,
						san: move.san,
						color: move.color,
						id: idx,
					})
				);
			};
			const onMove = ({ move, clientID, gameOver, info }) => {
				// todo retrieve time left on each players clock &..
				// todo retrieve time msg sent and calc diff time now &...
				// todo adjust time left from time diff

				if (clientID != Api.getClientID() && !roomState.gameOver) {
					Scene.game().handleOpponentMove(move);
				} else if (!state.committed) {
					actions.commit();
				}
				if (gameOver && info) {
					// Scene.resetGame()
					// this.game_over = true
					// checkmate|abort|abandon|resign|draw|stalemate|time|3foldrep
					roomActions.endGame(info);
				}
			};
			const onStart = () => {
				actions.startMatch();
				delay(300).then((_) => roomActions.alert.close("start"));
			};
			const onEnd = (info) => {
				roomActions.endGame(info);
			};
			// const onEnd = ({ info }) => { roomActions.endGame({info}) };
			const onDrawOffer = ({ to }) => {
				if (Api.getClientID() == to) {
					roomActions.alert.show(draw);
				}
			};

			if (state.player && !state.ready && Api.isConnected()) {
				// todo ready up player after camera animation
				console.log(`Player ready [${state.playerColor}]`);
				actions.ready();
			}

			Api.setMessageHandlers({
				sync: onSync,
				start: onStart,
				move: onMove,
				end: onEnd,
				offerDraw: onDrawOffer,
			});

			const createScene = (canvas) => {
				// window.location.hash = `#${roomID}`; // todo use hash in lobby to redirect to room
				// Scene.onReady = () => {};
				delay(300).then((_) =>
					Scene.setupGame(canvas, roomActions, roomID)
				);
				canvas.focus();
			};

			return <canvas oncreate={createScene} id="renderCanvas"></canvas>;
		},
});


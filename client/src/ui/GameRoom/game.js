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
		playerColor: null,
		ready: false,
		// initialized: false,
		matchStarted: false,
		committed: false,
	},
	actions: {
		setPlayer:
			({ player, playerColor, committed }) =>
			(state) => {
				Scene.manager.animateCameraIntoPosition(
					playerColor || 'white'
				);
				Scene.game().playerColor = playerColor;
				return { player, playerColor, committed };
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
		uncommit: () => () => ({ committed: false }),
	},
	view:
		(state, actions) =>
		({ roomID, roomState, roomActions, clockActions }) => {
			const onSync = (board) => {
				Scene.board().syncBoard(board);
				board.moves.forEach(({info}, idx) =>
					roomActions.sidePanel.moves.addMove({
						piece: info.piece,
						san: info.san,
						color: info.color,
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
				delay(300).then((_) =>
					roomActions.alert.close({ id: "start"})
				);
			};
			const onEnd = (info) => {
				roomActions.endGame(info);
			};
			// const onEnd = ({ info }) => { roomActions.endGame({info}) };
			const onRematch = () => {
				roomActions.restartGame();
				roomActions.sidePanel.moves.clear();
				Scene.board().moveService.send({ type: "RESET_BOARD" });
				roomActions.alert.show(RematchAlert());
				actions.uncommit();
				delay(300).then((_) =>
					roomActions.alert.close({ id: "rematch"})
				);
			};
			const onOffer = ({ type }) => {
				// if (!roomState.controls.recentlyOffered) {
					roomActions.alert.show(OfferAlert(type));
				// }
			};

			if (state.player && !state.ready && Api.isConnected()) {
				console.log(`Player ready [${state.playerColor}]`);
				actions.ready();
			}

			Api.setMessageHandlers({
				sync: onSync,
				start: onStart,
				rematch: onRematch,
				offer: onOffer,
				move: onMove,
				end: onEnd,
				disconnect: Api.reconnect(), //! if hosting game, reconnect immediately
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

function OfferAlert(type) {
	const capitalize = (s) => s && s[0].toUpperCase() + s.slice(1);
	const message =
		type == "draw"
			? "Opponent would like to draw the match."
			: "Opponent would like a rematch";
	return {
		// icon: "./assets/create/host.svg",
		id: type,
		role: "none",
		heading: `${capitalize(type)} Offered`,
		message,
		actions: {
			confirm: {
				text: "Accept",
				handler: (bool, persist) => {
					// setShare({ bool, persist });
					Api[type](true);
				},
			},
			default: {
				text: "Deny",
				handler: (bool, persist) => {
					Api[type](false);
				},
			},
		},
	};
}
function RematchAlert() {
	return {
		// icon: "./assets/create/host.svg",
		id: "rematch",
		role: "none",
		heading: "Rematch Agreed",
		message: "A new match will begin shortly.",
		// actions: {
		// 	default: {
		// 		text: "Abort",
		// 		handler: (_) => {
		// 			Api.deleteRoom(state.hostedRoom);
		// 		},
		// 	},
		// },
	};
}
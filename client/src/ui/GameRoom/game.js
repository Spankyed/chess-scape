import { h } from 'hyperapp';
import { delay } from "nanodelay";
import Scene from '../../core/Scene';
import Api from "../../api/Api"; 
import Prompts from "./controls/prompts.js";

// todo: if in game and websocket disconnects, reconnect
// todo: make sure scene & resizeObserver get disposed when component unmounts
export default (initial) => ({
	state: {
		player: false,
		ready: false,
		committed: false,
		playerColor: null,
		colorToMove: "white",
		matchStarted: false,
		type: "forever", //! hardcoded for now, replace when clocks implemented
		infoRecieved: false,
		creatingScene: false,
		// finished: false, // todo remove if isnt used, or use instead of room.gameOver
	},
	actions: {
		changeTurn: (colorToMove) => ({ colorToMove }),
		createScene: ({ canvas, roomActions, roomID }) => {
			canvas.focus();
			Scene.setupGame({ canvas, actions: roomActions, roomID });
			return { creatingScene: true };
		},
		setInfo:
			({ info = {}, isSceneSetup }) =>
			(_, { prepareGame }) => {
				if (isSceneSetup) prepareGame(info);
				return {
					...info, // set player
					infoRecieved: true,
					creatingScene: !isSceneSetup,
					matchStarted: !!info.matchStarted,
				};
			},
		prepareGame:
			(info) =>
			({ player, playerColor, matchStarted, gamePrepared }, actions) => {
				if (gamePrepared) return;
				const color = playerColor || info?.playerColor;
				Scene.manager.animateCameraIntoPosition(color || "white"); // sometimes causes wierd camera issue for spectators if not delayed
				// delay(100).then(_=> Scene.manager.animateCameraIntoPosition(cameraColor))
				const isPlayer = player || info?.player;
				const isStarted = matchStarted || info?.matchStarted;
				if (isPlayer) {
					Scene.game().playerColor = color;
					if (isStarted)
						actions.enableMoving(info || { player, playerColor });
					else {
						actions.ready(color);
					}
				}
				return { creatingScene: false, gamePrepared: true };
			},
		ready:
			(color) =>
			({ playerColor }) => {
				console.log(`Player ready [${color || playerColor}]`);
				Api.ready(color || playerColor);
				return { ready: true };
			},
		enableMoving:
			({ player, playerColor } = {}) =>
			(state) => {
				if (player || state.player)
					Scene.board().moveService.send({
						type: "SET_PLAYER",
						value: {
							isPlayer: true,
							playerColor: playerColor || state.playerColor,
						},
					});
				return { matchStarted: true };
			},
		// finish: () => () => ({ finished: true }),
		commit: () => () => ({ committed: true }),
		uncommit: () => () => ({ committed: false }),
	},
	view:
		(state, actions) =>
		({ roomID, roomState, roomActions, clockActions }) => {
			const onSync = (board) => {
				Scene.board().syncBoard(board);
				board.moves.forEach(({ info }, idx) =>
					roomActions.sidePanel.moves.addMove({
						piece: info.piece,
						san: info.san,
						color: info.color,
						id: idx,
					})
				);
				actions.changeTurn(board.colorToMove);
			};
			const onMove = ({
				move,
				clientID,
				gameOver,
				info,
				colorToMove,
			}) => {
				// todo include & retrieve time left on each players clock
				// todo calc msg-trip-time (time now - message sent)
				// todo adjust time left by subtracting msg-trip-time

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
				} else {
					actions.changeTurn(colorToMove);
				}
			};
			const onStart = () => {
				actions.enableMoving();
				delay(300).then((_) =>
					roomActions.alert.close({ id: "start" })
				);
			};
			const onEnd = (info) => {
				roomActions.endGame(info);
			};
			const onRematch = () => {
				roomActions.restartGame();
				roomActions.sidePanel.moves.clear();
				Scene.board().moveService.send({ type: "RESET_BOARD" });
				roomActions.alert.show(Prompts.onRematch);
				actions.uncommit();
			};
			const onOffer = ({ type }) => {
				// if (!roomState.controls.recentlyOffered) {
				roomActions.alert.show(Prompts.offered(type));
				// }
			};
			Api.setMessageHandlers({
				sync: onSync,
				start: onStart,
				rematch: onRematch,
				offer: onOffer,
				move: onMove,
				end: onEnd,
				// todo only reconnect immediately for players
				// todo on reconnect sync board
				// todo for spectators sync board on idleReconnect
			});

			if (
				state.infoRecieved &&
				state.creatingScene &&
				!roomState.loader.isLoading
			) {
				actions.prepareGame();
			}
			// const removeScene = (canvas) => {
			// 	// scene.dispose()
			// }

			// if (!creatingScene && !gamePrepared) {
			// 	actions.createScene();
			// }
			return (
				<canvas
					oncreate={(canvas) =>
						actions.createScene({ canvas, roomActions, roomID })
					}
					// onremove={removeScene}
					id="renderCanvas"
				></canvas>
			);
		},
});
import { h } from 'hyperapp';
import prompts from './prompts.js';
import Menu from './menu.js';
import Scene from "../../../core/Scene";

const menu = Menu()

export default (initial) => ({
	state: {
		menu: menu.state,
		isPromoting: false,
		resolve: null,
		reject: null,
		players: {},
		cameraViewColor: null,
	},
	actions: {
		menu: menu.actions,
		setPlayers: (players) => (state) => ({ players }),
		openPieceSelect:
			({ resolve, reject }) =>
			(_) => ({
				resolve,
				reject,
				isPromoting: true,
			}),
		closePieceSelect:
			(reject) =>
			({ reject }) => {
				reject && reject();
				return { isPromoting: false };
			},
		flipCamera:
			(playerColor) =>
			({ cameraViewColor }) => {
				let currColor = cameraViewColor || playerColor || "white";
				let oppColor = currColor == "white" ? "black" : "white";
				Scene.manager.animateCameraIntoPosition(oppColor);
				return {
					cameraViewColor: oppColor,
				};
			},
	},
	view:
		(state, actions) =>
		({ leaveRoom, toggleSidePanel, roomState, alert }) => {
			const MenuView = menu.view(state.menu, actions.menu);

			const {
				loader,
				gameOver,
				matchInfo,
				game,
				closed: roomClosed,
			} = roomState;

			const leave = () => {
				if (roomState.room?.players > 1 && !game.matchStarted) return; // player cant leave until match started
				if (
					!roomState.room ||
					gameOver ||
					!game.player ||
					!game.matchStarted ||
					game.type == "forever"
				) {
					leaveRoom();
				} else {
					const method = !game.committed ? "abort" : "abandon";
					alert.show(prompts[method](leaveRoom));
				}
			};

			const isSpectator = game.infoRecieved && !game.player;
			return (
				// pointer-events-none controls-wrapper
				<div
					class={`controls-wrapper ${!loader.removed && "hidden"}`}
				>
					<div class="controls">
						<OrientationPrompt />
						
						{gameOver && <MatchMessage matchInfo={matchInfo} />}
						{state.isPromoting && (
							<PieceSelection
								color={game.playerColor}
								resolve={state.resolve}
								closePieceSelect={actions.closePieceSelect}
							/>
						)}

						{/* Player cards */}
						<Players
							players={state.players}
							{...{ game, gameOver, matchInfo }}
						/>

						{/* Flip Camera button */}
						{isSpectator && (
							<div class="btn-wrapper top center">
								<button
									onclick={() => actions.flipCamera()}
									class="control-btn"
								>
									<img src="./assets/controls/flip-camera.svg"></img>
								</button>
							</div>
						)}
						{/* Back button */}
						<div class="btn-wrapper left">
							<button onclick={leave} class="control-btn">
								<img src="./assets/controls/back.svg"></img>
							</button>
						</div>
						{/* Menu button */}
						<div class="btn-wrapper right">
							<MenuView
								{...{
									alert,
									roomState,
									toggleSidePanel,
									isSpectator,
								}}
								flipCamera={actions.flipCamera}
							/>
						</div>
					</div>
				</div>
			);
		},
});

function Players({ players, game, gameOver, matchInfo }) {
	let userImg = (username) => username
			? `https://avatars.dicebear.com/api/avataaars/${username}.svg`
			: "./assets/controls/avatar-placeholder.svg";
	let { white, black } = players;
	let { colorToMove, matchStarted } = game;
	let isTurn = (color) => color === colorToMove && matchStarted && !gameOver;
	let isWinner = (color) => color === matchInfo?.winningColor && gameOver;
	// Jane⚔️Doe
	return (
		<div class="player-section">
			<div
				class={`player left ${isWinner("white") && "winner"} ${
					isTurn("white") && "selected"
				}`}
			>
				<img
					class={`picture ${!white?.username && "default"}`}
					src={userImg(white?.username)}
				/>
				<div class="tagline left">
					{white?.username ? (
						<span class="name">{white.username}</span>
					) : (
						<span class="name">Waiting...</span>
					)}
					{/* <div class="clock"></div> */}
					{/* <div class="text-normal text-gray-300 hover:text-gray-400 cursor-pointer"><span class="border-b border-dashed border-gray-500 pb-1">Administrator</span></div> */}
					{/* <div class="text-sm text-gray-300 hover:text-gray-400 cursor-pointer md:absolute pt-3 md:pt-0 bottom-0 right-0">Last Seen: <b>2 days ago</b></div> */}
				</div>
			</div>
			<div
				class={`player right ${isWinner("black") && "winner"} ${
					isTurn("black") && "selected"
				}`}
			>
				<div class="tagline right">
					{black?.username ? (
						<span class="name">{black.username}</span>
					) : (
						<span class="name">Waiting...</span>
					)}
					{/* <div class="clock"></div> */}
				</div>
				<img
					class={`picture ${!black?.username && "default"}`}
					src={userImg(black?.username)}
				/>
			</div>
		</div>
	);
}

function MatchMessage({ matchInfo }) {
	const {endMethod, winningColor, mated} = matchInfo
	const capitalize = (s) => s && s[0].toUpperCase() + s.slice(1);

	const headers = {
		abort: 'Aborted',
		abandon: 'Abandoned',
		resign: 'Resigned',
		draw: 'Draw',
	};
	const header = mated ? 'Checkmate' : headers[endMethod]
	const victorMessage = `${capitalize(winningColor)} Is Victorious` 
	const message = endMethod == "draw" || endMethod == "abort" ? "There Is No Winner" : victorMessage;
	return (
		<div class="message-wrapper">
			<div class={`match-message ${winningColor}`}>
				<div class="messages">
					<div id="topic-1" class="message-topic">
						{header}
					</div>
					<div id="message-1" class="message-content">
						<span>{message}</span>
					</div>
				</div>
			</div>
		</div>
	);
}
function PieceSelection({resolve, closePieceSelect, color}){
	color = color.charAt(0)
	function select(piece){
		if (resolve) resolve(piece);
		closePieceSelect()
	}
	return (
		<div class="promotion-wrapper" onclick={(_) => select(null)}>
			<div class="promotion">
				<h2>Select a piece</h2>
				<div class="pieces">
					<div onclick={(_) => select("q")} class="piece">
						<img src={`./assets/controls/pieces/queen_${color}.png`} />
					</div>
					<div onclick={(_) => select("n")} class="piece">
						<img src={`./assets/controls/pieces/knight_${color}.png`} />
					</div>
					<div onclick={(_) => select("r")} class="piece">
						<img src={`./assets/controls/pieces/rook_${color}.png`} />
					</div>
					<div onclick={(_) => select("b")} class="piece">
						<img src={`./assets/controls/pieces/bishop_${color}.png`} />
					</div>
				</div>
				{/* <div onclick={_=> select(false)} class="piece w-1/2"><img src={`./assets/controls/pieces/bishop_${color}.svg`}/></div> */}
				<button onclick={(_) => select(null)}>Cancel</button>
			</div>
		</div>
	);
}

function OrientationPrompt() {
	return (
		<div class="orientation-prompt">
			<div class="title">Portait Mode Unsupported</div>
			<img src="./assets/controls/rotate-device.svg"></img>
			<div class="message">
				Please rotate your device into landscape mode.
			</div>
		</div>
	);
}
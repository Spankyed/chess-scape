import { h } from 'hyperapp';
import prompts from './prompts.js';
import Api from "../../../api/Api"; 

export default (initial) => ({
	state: {
		menuOpen: false,
		isPromoting: false,
		resolve: null,
		reject: null,
	},
	actions: {
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
		toggleMenu: (ev) => (state) => ({ menuOpen: !state.menuOpen }),
	},
	view:
		(state, actions) =>
		({ leaveRoom, toggleSidePanel, roomState, alert}) => {
			const { isLoading, gameOver, matchInfo, game } = roomState;

			const leave = () => {
				if (gameOver) leaveRoom();
				else {
					const method = !game.committed ? "abort" : "abandon";
					alert.show(prompts[method](leaveRoom));
				}
			};
			return (
				// pointer-events-none controls-wrapper
				<div
					class={`controls-wrapper pointer-events-none ${
						isLoading && "hidden"
					}`}
				>
					<div class="controls">
						{gameOver && <MatchMessage matchInfo={matchInfo} />}
						{state.isPromoting && (
							<PieceSelection
								color={game.playerColor}
								resolve={state.resolve}
								closePieceSelect={actions.closePieceSelect}
							/>
						)}
						<div class="player-section">
							<Player />
							<Opponent />
						</div>
						{/* back button */}
						<div class="btn-wrapper left">
							<button onclick={leave} class="control-btn">
								<img src="./assets/controls/back.svg"></img>
							</button>
						</div>
						<div class="btn-wrapper right">
							{/* menu */}
							<div class="menu-wrapper">
								{state.menuOpen && (
									<Menu
										toggleMenu={actions.toggleMenu}
										{...{ game, alert, gameOver, toggleSidePanel }}
									/>
								)}
								<button
									onclick={actions.toggleMenu}
									class="control-btn first"
								>
									<img src="./assets/controls/menu.svg"></img>
								</button>
							</div>
							{
								// todo: hide btn on mobile
								/* sidePanel button */
							}
							<button
								onclick={(_) => toggleSidePanel()}
								class="control-btn"
							>
								<img src="./assets/controls/sidePanel.svg"></img>
							</button>
						</div>
					</div>
				</div>
			);
		},
});
function Menu({ alert, game, gameOver, toggleMenu, toggleSidePanel }) {

	const openPanel = (tab) => () => {
		toggleMenu();
		toggleSidePanel(tab);
	};
	const prompt = (method) => () => {
		toggleMenu();
		alert.show(prompts[method]);
	};

	const offer = (type) => () => {
		Api.offer(type);
	}

	return (
		// needs pointer events
		<div
			class="menu pointer-events-auto"
			role="menu"
			aria-orientation="vertical"
			aria-labelledby="menu-button"
			tabindex="-1"
		>
			{game.committed && (
				<div
					onclick={prompt("resign")}
					class="menu-item"
					role="menu-item"
					id="menu-item-0"
					tabindex="-1"
				>
					<div class="menu-icon">
						<img src="./assets/controls/menu/resign.svg" />
					</div>
					<span>Resign</span>
				</div>
			)}
			{/* { true && */}
			{gameOver && (
				<div
					onclick={offer("rematch")}
					class="menu-item"
					role="menu-item"
					id="menu-item-0"
					tabindex="-1"
				>
					<div class="menu-icon">
						<img src="./assets/controls/menu/rematch.svg" />
					</div>
					<span>Rematch</span>
				</div>
			)}
			<div
				// onclick={offer("draw")}
				class="menu-item"
				role="menu-item"
				id="menu-item-2"
				tabindex="-1"
			>
				<div class="menu-icon">
					<img src="./assets/controls/menu/draw.svg" />
				</div>
				<span>Offer Draw</span>
			</div>
			<div
				class="menu-item"
				role="menu-item"
				id="menu-item-2"
				tabindex="-1"
			>
				<div class="menu-icon">
					<img src="./assets/controls/menu/chat.svg" />
				</div>
				<span>Chat</span>
			</div>
			<div
				class="menu-item"
				role="menu-item"
				id="menu-item-2"
				tabindex="-1"
			>
				<div class="menu-icon">
					<img src="./assets/controls/menu/review.svg" />
				</div>
				<span>Review Moves</span>
			</div>
			<div
				onclick={openPanel("media")}
				class="menu-item"
				role="menu-item"
				id="menu-item-4"
				tabindex="-1"
			>
				<div class="menu-icon">
					<img src="./assets/controls/menu/media.svg" />
				</div>
				<span>Play Media</span>
			</div>
			<div
				onclick={openPanel("media")}
				class="menu-item"
				role="menu-item"
				id="menu-item-4"
				tabindex="-1"
			>
				<div class="menu-icon">
					<img src="./assets/controls/menu/rotate-camera.svg" />
				</div>
				<span>Flip Camera</span>
			</div>
		</div>
	);
}
function Player(){
	let defaultSrc = "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png"
	return (
		<div class="player left winner">
			<img class="picture" src={defaultSrc}/>  
			<div class="tagline left">
				<div class="name">John Dossssssssssssssssssssse</div>
				<div class="clock">
					<img class="icon" src="./assets/controls/clock.svg"></img>
					<span class="time">10:00</span>
				</div>
				{/* <div class="text-normal text-gray-300 hover:text-gray-400 cursor-pointer"><span class="border-b border-dashed border-gray-500 pb-1">Administrator</span></div> */}
				{/* <div class="text-sm text-gray-300 hover:text-gray-400 cursor-pointer md:absolute pt-3 md:pt-0 bottom-0 right-0">Last Seen: <b>2 days ago</b></div> */}
			</div>
		</div>
	)
}
function Opponent(){
	let defaultSrc = "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png"
	return (
		<div class="player right">
			<div class="tagline right">
				<div class="name">Jane⚔️Doe</div>
				<div class="clock">
					<span class="time">10:00</span>
					<img class="icon" src="./assets/controls/clock.svg"></img>
				</div>
			</div>
			<img class="picture" src={defaultSrc}/>  
		</div>
	)
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
		<div class="promotion-wrapper">
			<h2 class='w-full mx-auto text-gray-600'>Select a piece</h2>
			<div onclick={_=> select('q')} class="piece w-1/2"><img src={`./assets/controls/pieces/queen_${color}.png`}/></div>
			<div onclick={_=> select('n')} class="piece w-1/2"><img src={`./assets/controls/pieces/knight_${color}.png`}/></div>
			<div onclick={_=> select('r')} class="piece w-1/2"><img src={`./assets/controls/pieces/rook_${color}.png`}/></div>
			<div onclick={_=> select('b')} class="piece w-1/2"><img src={`./assets/controls/pieces/bishop_${color}.png`}/></div>
			{/* <div onclick={_=> select(false)} class="piece w-1/2"><img src={`./assets/controls/pieces/bishop_${color}.svg`}/></div> */}
			<button onclick={_=> select(null)}>Cancel</button>
		</div>
	)
}
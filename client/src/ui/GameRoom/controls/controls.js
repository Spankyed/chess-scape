import { h } from 'hyperapp';
import prompts from './prompts.js';
import Menu from './menu.js';

const menu = Menu()

export default (initial) => ({
	state: {
		menu: menu.state,
		isPromoting: false,
		resolve: null,
		reject: null,
	},
	actions: {
		menu: menu.actions,
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
	},
	view:
		(state, actions) =>
		({ leaveRoom, toggleSidePanel, roomState, alert }) => {

			const MenuView = menu.view(state.menu, actions.menu)
			
			const {
				loader,
				gameOver,
				matchInfo,
				game,
				closed: roomClosed,
			} = roomState;

			const leave = () => {
				if (roomState.room?.players > 1 && !game.matchStarted) return; // player cant leave until match started
				if (!roomState.room || gameOver || !game.player || !game.matchStarted || game.type == 'forever'){
					leaveRoom();
				}
				else {
					const method = !game.committed ? "abort" : "abandon";
					alert.show(prompts[method](leaveRoom));
				}
			};
			
			return (
				// pointer-events-none controls-wrapper
				<div
					class={`controls-wrapper ${
						loader.isLoading && "hidden"
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
							<MenuView
								{...{
									alert,
									roomState,
									toggleSidePanel,
								}}
							/>
						</div>
					</div>
				</div>
			);
		},
});

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
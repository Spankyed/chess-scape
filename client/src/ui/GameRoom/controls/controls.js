import { h } from 'hyperapp';
import { cancel } from 'xstate/lib/actionTypes';

export default initial => ({
	state: { 
		menuOpen: false,
		isPromoting: false,
		resolver: null
	},
	actions: { 
		openPieceSelect: resolver => _ => ({resolver, isPromoting: true}),
		closePieceSelect: _ => _ => ({isPromoting: false}),
		toggleMenu: (ev) => (state) => ({menuOpen: !state.menuOpen}),
	},
	view: (state, actions) => ({isLoading, toggleSidePanel, gameOver, color}) => {
		return ( 
			// pointer-events-none controls-wrapper
			<div class={`controls-wrapper pointer-events-none ${isLoading && 'hidden'}`}>
				<div class="controls">
					{ gameOver  &&
						<MatchMessage/>
					}
					{ true && //state.isPromoting  &&
						<PieceSelection color={color} resolver={state.resolver} closePieceSelect={actions.closePieceSelect}/>
					}
					<div class="player-section"> 
						<Player/>
						<Opponent/>
					</div>
					{/* back button */}
					<div class="btn-wrapper left">
						<button class="control-btn">
							<img src="./assets/controls/back.svg"></img>
						</button>
					</div>
					<div class="btn-wrapper right">
						{/* menu */}
						<div class="menu-wrapper">
							{ state.menuOpen && <Menu gameOver={gameOver}/> }
							<button onclick={actions.toggleMenu} class="control-btn first">
								<img src="./assets/controls/menu.svg"></img>
							</button>
						</div>
						{ // todo: hide btn on mobile
						  /* sidePanel button */}
						<button onclick={_=> toggleSidePanel()} class="control-btn">
							<img src="./assets/controls/sidePanel.svg"></img>
						</button>
					</div>
				</div>
			</div>
		)
	}
})
function Menu({gameOver}){
	return (
		// needs pointer events
		<div class="menu" role="menu" aria-orientation="vertical" aria-labelledby="menu-button" tabindex="-1">
			<div class="menu-item" role="menu-item" id="menu-item-0" tabindex="-1">
				<div class='menu-icon'><img src='./assets/controls/menu/resign.svg'/></div>
				<span>Resign</span>
			</div>
			{ true && // gameOver  && 
				<div class="menu-item" role="menu-item" id="menu-item-0" tabindex="-1">
					<div class='menu-icon'><img src='./assets/controls/menu/rematch.svg'/></div>
					<span>Rematch</span>
				</div>
			}
			<div class="menu-item" role="menu-item" id="menu-item-2" tabindex="-1">
				<div class='menu-icon'><img src='./assets/controls/menu/draw.svg'/></div>
				<span>Offer Draw</span>
			</div>
			<div class="menu-item" role="menu-item" id="menu-item-2" tabindex="-1">
				<div class='menu-icon'><img src='./assets/controls/menu/chat.svg'/></div>
				<span>Chat</span>
			</div>
			<div class="menu-item" role="menu-item" id="menu-item-2" tabindex="-1">
				<div class='menu-icon'><img src='./assets/controls/menu/review.svg'/></div>
				<span>Review Moves</span>
			</div>
			<div onclick={_=> toggleSidePanel("media")} class="menu-item" role="menu-item" id="menu-item-4" tabindex="-1">
				<div class='menu-icon'><img src='./assets/controls/menu/media.svg'/></div>
				<span>Play Media</span>
			</div>
			<div onclick={_=> toggleSidePanel("media")} class="menu-item" role="menu-item" id="menu-item-4" tabindex="-1">
				<div class='menu-icon'><img src='./assets/controls/menu/rotate-camera.svg'/></div>
				<span>Flip Camera</span>
			</div>
		</div>
	)
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
function MatchMessage(){
	return (
		<div class="message-wrapper">
			<div class='match-message'>
				<div class="messages">
					<div id="topic-1" class="message-topic">MATCH</div>
					<div id="message-1" class="message-content">
						<span>White is Victorious</span>
					</div>
				</div>
			</div>
		</div>
	)
}
function PieceSelection({resolver, closePieceSelect, color}){
	color = color || 'b'
	function select(piece){
		resolver(piece)
		closePieceSelect()
	}
	return (
		<div class="promotion-wrapper">
			<h2 class='w-full mx-auto text-gray-600'>Select a piece</h2>
			<div onclick={_=> select('q')} class="piece w-1/2"><img src={`./assets/controls/pieces/queen_${color}.png`}/></div>
			<div onclick={_=> select('n')} class="piece w-1/2"><img src={`./assets/controls/pieces/knight_${color}.png`}/></div>
			<div onclick={_=> select('r')} class="piece w-1/2"><img src={`./assets/controls/pieces/rook_w.png`}/></div>
			<div onclick={_=> select('b')} class="piece w-1/2"><img src={`./assets/controls/pieces/bishop_${color}.png`}/></div>
			{/* <div onclick={_=> select(false)} class="piece w-1/2"><img src={`./assets/controls/pieces/bishop_${color}.svg`}/></div> */}
			<button onclick={_=> select(null)}>Cancel</button>
		</div>
	)
}
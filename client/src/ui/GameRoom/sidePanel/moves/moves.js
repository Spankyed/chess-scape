import { h } from 'hyperapp';

// todo: let players download game pgn/fen
// todo: alert that user is in review, option to cancel
// todo: add list empty state

// ['♟','♘','♝','♜','♛','♚']
// ['♙','♘','♗','♖','♕','♔']
const pieceSymbols = {p:'♟',r:'♖',n:'♘',b:'♗',q:'♕',k:'♔'}
export default initial => ({
	state: { 
		currMove: null,
		// moveCount: 2,
		moves: {
			w:[],
			b:[]
		}
	},
	actions: { 
		addMove: ({move, fen}) => ({moves}) => ({
			moves: { ...moves, 
				[move.color]:[ ...moves[move.color], 
					{
						piece: pieceSymbols[move.piece], 
						to: move.san,
						fen
					}
				]
			}
		}),
		startReview: move => () => ({inReview: true, currMove: move}),
		endReview: _=> _=> ({inReview: false, currMove: null}),
	},
	view: (state, actions) => ({alert}) => {
		// console.log(state.moves)
		return (
			<div class="h-full w-full">
				<div class='header w-full flex'>
					<h2 class="pr-2">Download</h2>
					<button class="download-button" type="button">PGN</button>
					<button class="download-button" type="button">FEN</button>
				</div>
				<div class="moves move-list flex flex-row h-full w-full">
					<index class="h-full w-1/5 text-lg bg-gray-200 flex flex-col flex-wrap">
						{
							[...new Array(state.moves.w.length)].map((_,idx) => (
								<span>{idx+1}</span>
							))
						}
					</index>
					<div class="white colors-moves h-full flex flex-col w-2/5">
					{
						state.moves.w.map((move,i)=>
							<Move move={move} {...actions} alert={alert} currMove={state.currMove}/>
						)
					}
					</div>
					<div class="black colors-moves h-full flex flex-col w-2/5">
					{
						state.moves.b.map((move,i)=>
							<Move move={move} {...actions} alert={alert} currMove={state.currMove}/>
						)
					}
					</div>
				</div>
			</div>

		);
	},
})

function Move({move, currMove, startReview, endReview, alert}){
	function review(){
		startReview(move)
		// promptReview(alert, endReview)
		interact.game.setReview(move.fen)
	}
	return (
		<move onclick={review} class={`${ currMove == move && ' active'}`}>
			<sans> {move.piece} </sans>
			to {move.to}
		</move>
	)
}

function promptReview(alert, endReview){
	alert.show({
		icon: "./assets/sidePanel/controls/review_icon.svg",
		heading: 'In Review',
		message: "You are currently reviewing moves. The board does not reflect current game state.", 
		actions: {
			cancel: { text: 'End', handler: _ => {
				endReview()
				interact.game.resumePlay()
			}}
		}
	})
}

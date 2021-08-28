import { h } from 'hyperapp';
import { saveAs } from 'file-saver';

// todo: add list empty state
// ['♟','♘','♝','♜','♛','♚'] // white
// ['♙','♘','♗','♖','♕','♔'] // black
const pieceSymbols = {p:'♟',r:'♖',n:'♘',b:'♗',q:'♕',k:'♔'}
export default initial => ({
	state: { 
		reviewDisabled: false, 
		inReview: false, 
		currMove: null,
		moves: {
			w:[],
			b:[]
		}
	},
	actions: { 
		addMove: ({move, fen, boardMap}) => ({moves}) => ({
			moves: { ...moves, 
				[move.color]:[ ...moves[move.color], 
					{
						piece: pieceSymbols[move.piece], 
						to: move.san,
						fen, boardMap
					}
				]
			}
		}),
		startReview: move => () => ({inReview: true, currMove: move}),
		endReview: _=> _=> ({inReview: false, currMove: null}),
	},
	view: (state, actions) => ({alert}) => {
		function download(type){
			let date = new Date().toLocaleDateString('en-GB', {
				month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
			}).replace(/\//g, '-').replace(/,/, '').replace(/:/, '');
			let content = interact.game.engine[type]()
			let filename = `match-${date}.${type}`;
			let blob = new Blob([content], {
			 type: "text/plain;charset=utf-8"
			});
			saveAs(blob, filename);
		}
		return (
			<div class="h-full w-full">
				<div>
				<div class='header w-full flex justify-end'>
					<h2 class="dl-header pr-2">Download</h2>
					<button onclick={_=> download('pgn')} class="download-button" type="button">PGN</button>
					<button onclick={_=> download('fen')} class="download-button" type="button">FEN</button>
				</div>
				</div>

				<div class="moves move-list flex flex-row h-full w-full">
					<index class="h-full w-1/5 text-lg bg-gray-200 flex flex-col">
						{
							[...new Array(state.moves.w.length)].map((_,idx) => (
								<span>{idx+1}</span>
							))
						}
					</index>
					<div class="white colors-moves h-full flex flex-col w-2/5">
					{
						state.moves.w.map((move,i)=>
							<Move move={move} alert={alert} {...actions} {...state}/>
						)
					}
					</div>
					<div class="black colors-moves h-full flex flex-col w-2/5">
					{
						state.moves.b.map((move,i)=>
							<Move move={move} alert={alert} {...actions} {...state}/>
						)
					}
					</div>
				</div>
			</div>

		);
	},
})

function Move({move, currMove,  reviewDisabled, inReview, startReview, endReview, alert}){
	function review(){
		// if (reviewDisabled) return
		startReview(move)
		if (!inReview) promptReview(alert, endReview)
		interact.game.setReview(move)
	}
	return (
		<move onclick={review} class={`${ currMove == move && ' active'}`}>
			<sans> {move.piece} </sans>
			- {move.to}
		</move>
	)
}

function promptReview(alert, endReview){
	alert.show({
		icon: "./assets/sidePanel/controls/review_icon.svg",
		heading: 'Reviewing Moves',
		// message: "You are currently reviewing moves. The board does not reflect current game state.", 
		message: "The board does not reflect current game.", 
		actions: {
			cancel: { text: 'End', handler: _ => {
				interact.game.resumePlay()
			}}
		}
	})
}

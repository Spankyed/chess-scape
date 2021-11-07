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
		moves: { w:[], b:[] }
	},
	actions: { 
		addMove: ({color, ...move}) => ({moves}) => ({
			moves: { ...moves, [color]:[ ...moves[color], move ] }
		}),
		startReview: move => () => ({inReview: true, currMove: move}),
		endReview: _=> _=> ({inReview: false, currMove: null}),
		clear: _=> _=> ({moves: { w:[], b:[] }}),
	},
	view: (state, actions) => ({ alert }) => {
		const download = (type) => () => {
			let date = new Date().toLocaleDateString('en-GB', {
				month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
			}).replace(/\//g, '-').replace(/,/, '').replace(/:/, '');
			let content = interact.game.engine[type]() //! 
			let filename = `match-${date}.${type}`;
			let blob = new Blob([content], {
				type: "text/plain;charset=utf-8"
			});
			saveAs(blob, filename);
		}

		return (
			<div class="moves">
				<div class="header">
					<h2 class="header-text">Download</h2>
					<button onclick={download("pgn")} type="button">
						PGN
					</button>
					<button onclick={download("fen")} type="button">
						FEN
					</button>
				</div>
				<div class="move-list">
					<index>
						{[...new Array(state.moves.w.length)].map((_, idx) => (
							<span class="number">{++idx}</span>
						))}
					</index>
					<div class="move-area-wrapper">
						<div class="move-area">
							<div class="moves-for white">
								{state.moves.w.map((move, i) => (
									<Move
										move={move}
										alert={alert}
										{...actions}
										{...state}
									/>
								))}
							</div>
							<div class="moves-for black">
								{state.moves.b.map((move, i) => (
									<Move
										move={move}
										alert={alert}
										{...actions}
										{...state}
									/>
								))}
							</div>
						</div>
					</div>
				</div>
			</div>
		);
	},
})
function Move({move, currMove,  reviewDisabled, inReview, startReview, endReview, alert}){
	// todo disable review when??
	function review(){
		// if (reviewDisabled) return
		startReview(move)
		if (!inReview) promptReview(alert, endReview)
		interact.board.moveService.send({type: 'REVIEW', value: move})
	}
	return (
		<div class="move-wrapper">
			<move
				onclick={review}
				class={`${currMove == move && " active"}`}
				title={move.san}
			>
				<sans>{pieceSymbols[move.piece]} </sans>
				<span>{move.san} </span>
			</move>
		</div>
	);
}
function promptReview(alert, endReview){
	alert.show({
		role: "warn",
		id: "review",
		icon: "./assets/sidePanel/controls/review_icon.svg",
		heading: "Reviewing Moves",
		// message: "You are currently reviewing moves. The board does not reflect current game state.",
		message: "The board does not reflect current game.",
		actions: {
			default: {
				text: "End",
				handler: (_) => {
					endReview();
					interact.board.moveService.send({ type: "END_REVIEW" });
				},
			},
		},
	});
}

import { h } from 'hyperapp';
// import Api from '../../../../api/Api';

export default initial => ({
	state: { 
		currMoveIdx: 0,
		moves: MockMoves()
	},

	actions: { 
	},

	view: (state, actions) => ({}) => {
		console.log(state.moves)
		return (
			<div class="moves h-full text-lg">
				<div class="move-list">
				{
					state.moves.map((move,i)=>
						<Move move={move} idx={i}/>
					)
				}
				</div>
			</div>
		);
	}
})

function Move({move,idx}){
	return (
		<row>
			<index>{move.idx + 1}</index>
			<move class='pl-3'>
				<sans> {move.piece} </sans>
				to {move.to}
			</move>
			<move>
				<sans> {move.piece} </sans>
				to {move.to}
			</move>
		</row>
	)
}


function MockMoves(){
	let blackPieces = ['♟','♘','♝','♜','♛','♚',]
	let whitePieces = ['♙','♘','♗','♖','♕','♔',]
	let ranks = ['A','B','C','D','E','F','G','H']
	let files = ['1','2','3','4','5','6','7','8']
	return Array(16).fill().map((x,idx)=>{
		if  (idx % 2 == 0) return {idx, piece: gRI(whitePieces), to:`${gRI(ranks)}${gRI(files)}`}
		else return {idx, piece: gRI(blackPieces), to:`${gRI(ranks)}${gRI(files)}`}
	})
}
function gRI(arr) {
	return arr[Math.floor(Math.random() * arr.length)];
}
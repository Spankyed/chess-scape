import { h } from 'hyperapp';

// todo: let players download game pgn/fen
// todo: alert that user is in review, option to cancel
export default initial => ({
	state: { 
		currMoveIdx: 0,
		moveCount: 10,
		whiteMoves: [ 
			{idx: 0, piece: "♔", to: "E1"},
			{idx: 1, piece: "♚", to: "D4"},
			{idx: 2, piece: "♖", to: "G7"}
		],
		blackMoves: [ 
			{idx: 0, piece: "♔", to: "E1"},
			{idx: 1, piece: "♚", to: "D4"},
			{idx: 2, piece: "♖", to: "G7"}
		],
		// moves: MockMoves()
	},
	actions: { 
	},
	view: (state, actions) => ({}) => {
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
						<span>1</span>
						<span>2</span>
						<span>3</span>
					</index>
					<div class="white colors-moves h-full flex flex-col w-2/5">
					{
						state.whiteMoves.map((move,i)=>
							<Move move={move} idx={i}/>
						)
					}
					</div>
					<div class="black colors-moves h-full flex flex-col w-2/5">
					{
						state.blackMoves.map((move,i)=>
							<Move move={move} idx={i}/>
						)
					}
					</div>
				</div>
			</div>

		);
	},
})

function Move({move,idx}){
	return (
		<move class=''>
			<sans> {move.piece} </sans>
			to {move.to}
		</move>
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







{/* <div class="moves h-full text-lg">
	<div class="move-list">
	{
		state.moves.map((move,i)=>
			<Move move={move} idx={i}/>
		)
	}
	</div>
</div> */}





// views: (state, actions) => ({}) => {
// 	// console.log(state.moves)
// 	return (
// 		<table>
// 			<colgroup>
// 				<col class="grey" />
// 				<col class="red" span="3" />
// 				<col class="blue" />
// 			</colgroup>
// 			<thead>
// 				<tr>
// 					<th>#</th>
// 					<th>color 1</th>
// 					<th>color 2</th>
// 				</tr>
// 			</thead>
// 			<tbody>
// 				<tr>
// 					<th>1</th>
// 					<td><move class="pl-3"><sans> ♗ </sans>to H8</move></td>
// 					<td><move class="pl-3"><sans> ♗ </sans>to H8</move></td>
// 				</tr>
// 				<tr>
// 					<th>2</th>
// 					<td>red</td>
// 					<td>red</td>
// 					<td>red</td>      
// 					<td>blue</td>
// 				</tr>
// 			</tbody>
// 		</table>
// 	);
// }
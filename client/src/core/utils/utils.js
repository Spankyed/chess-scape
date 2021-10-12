import { Observable } from 'rxjs';
// import { debounceTime, map, filter, pairwise, startWith } from 'rxjs/operators';
import { debounceTime } from 'rxjs/operators';
import initialState from "../board/state";

// https://github.com/twig-it/from-resize/blob/main/projects/from-resize/src/resize/resize.ts
const FromResize = (element) => {
	let resize$ = new Observable(subscriber => {
		const resizeObserver = new ResizeObserver(entries => {
			subscriber.next();
		});
		resizeObserver.observe(element);
		// resizeObserver.observe(element, { box: 'border-box' });
		return () => {
			// resizeObserver.unobserve(element);
			resizeObserver.disconnect();
		};
	})
	return resize$.pipe(debounceTime(1));
}

function SerializeBoard(squares, pieces, captured) { // returns a boardMap to be deserialized into changes
	return {
		squares: Object.entries(squares).reduce(
			(sqs, [sqName, { piece }]) => ({
				...sqs,
				[sqName]: piece ? piece.id : null,
			}),
			{}
		),
		pieces: Object.entries(pieces()).reduce(
			(pcs, [pieceId, piece]) => ({
				...pcs,
				[pieceId]: piece?.isEnabled(),
			}),
			{}
		),
		captured,
	};
}

// returns list of square changes & map of pieces
function DeserializeBoard(boardMap, squares, pieces) {
	const resetCaptured = Object.entries(squares)
		.filter(([name]) => name.startsWith("cp"))
		.map(([name]) => ({ type: "squares", name, piece: null }));
	// if (!pieces()[pieceId]){ //  clone/add promotion pieces that dont exist
	// 	let [type, color] = pieceId.split('_')
	// 	ClonePiece({type, color, pieces})
	// }
	return {
		sqChanges: [
			...resetCaptured, // add changes that reset captured(ghost) sqs; gets overwritten below
			...Object.entries(boardMap.squares).map(([name, pieceId]) => ({
				type: "squares",
				name,
				piece: pieces()[pieceId],
			})),
		],
		piecesMap: boardMap.pieces,
		captured: boardMap.captured,
	};
}

// function MapChangesToStates(moves) {
// 	let [initial, ...movesStates] = moves.reduce(
// 		(states, { pieces, squares, captured, fen }, idx) => {
// 			let lastState = states[idx - 1].board;
// 			return [
// 				...states,
// 				{
// 					board: {
// 						captured,
// 						pieces: {
// 							...lastState.pieces,
// 							pieces,
// 						},
// 						squares: {
// 							...lastState.squares,
// 							squares,
// 						},
// 					},
// 					fen,
// 				},
// 			];
// 		},
// 		initialState
// 	);
// 	return movesStates;
// }

function ClonePiece({type, color, pieces}){
	// let origPiecesCount = {'p':8,'r':2,'n':2,'b':2,'q':1,'k':1} // todo allow recycle prev cloned piece
	let pieceId = `${type}_${color}`
	let firstPiece = pieces()[pieceId + '_1']
    let clonedPiece = firstPiece.clone(firstPiece.name +  '_clone')
	let count = Object.entries(pieces).filter(([id]) => id.startsWith(pieceId)).length;
	clonedPiece.makeGeometryUnique()
	clonedPiece.id = `${pieceId}_${count+1}_p` //_p indicates its promotion piece 
	pieces()[clonedPiece.id] = clonedPiece;
	return clonedPiece;
}

export {
	SerializeBoard,
	DeserializeBoard,
	// MapChangesToStates,
	ClonePiece,
	FromResize,
};



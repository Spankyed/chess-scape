import { Observable } from 'rxjs';
// import { debounceTime, map, filter, pairwise, startWith } from 'rxjs/operators';
import { debounceTime } from 'rxjs/operators';
import initialState from "../board/state";
import { Vector3 } from "@babylonjs/core/Maths/math";


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
	
	Object.entries(boardMap.pieces).forEach(([pieceId]) => {
		//  clone/add promotion pieces that dont exist
		if (!pieces()[pieceId]) {
			let [type, color] = pieceId.split("_");
			console.log(ClonePiece({ type, color, pieces }));
		}
	});

	return {
		sqChanges: [
			...resetCaptured,
			...Object.entries(boardMap.squares).map(([name, pieceId]) => ({
				type: "squares",
				name,
				piece: pieces()[pieceId],
				...(!squares[name] && name.startsWith("cp")
					? {
							coords: createCaptureSq(
								...name.split("_").slice(1)
							).coords,
					  }
					: {}),
			})),
		],
		piecesMap: boardMap.pieces,
		captured: boardMap.captured,
	};
}

function createCaptureSq(count, color) {
	--count;
	let columnsCoords = [10, 11.5, 13]; // start columns horizontal: 2 units from board(8x8) & spread 1.5 units apart
	let column = (count / 8) | 0;
	let offsetMultiplier = count % 8;
	let x = columnsCoords[column];
	let z = -6.5 + 1.3 * offsetMultiplier; // start rows vertical: -6.5 and move each piece up 1.3 units
	let coords = color == "white" ? [-1 * x, 0, -1 * z] : [x, 0, z]; // invert coords for whites pieces
	return { coords: new Vector3(...coords), newCount: ++count };
};

function moveChangesToBoardMaps(moves) {
	let [initial, ...movesStates] = moves.reduce(
		(states, { pieces, squares, captured, fen, info }, idx) => {
			let lastState = states[idx].board;
			return [
				...states,
				{
					board: {
						captured: {
							...lastState.captured,
							...captured,
						},
						pieces: {
							...lastState.pieces,
							...pieces,
						},
						squares: {
							...lastState.squares,
							...squares,
						},
					},
					info,
					fen,
				},
			];
		},
		[{board: initialState}]
	);
	return movesStates;
}

function ClonePiece({type, color, pieces}){
	// let origPiecesCount = {'p':8,'r':2,'n':2,'b':2,'q':1,'k':1} // todo allow recycle prev cloned piece
	let pieceId = `${type}_${color}`
	let firstPiece = pieces()[pieceId + '_1']
    let clonedPiece = firstPiece.clone(firstPiece.name +  '_clone')
	let count = Object.entries(pieces()).filter(([id]) => id.startsWith(pieceId)).length;
	clonedPiece.makeGeometryUnique()
	clonedPiece.id = `${pieceId}_${count+1}_p` //_p indicates its promotion piece 
	pieces()[clonedPiece.id] = clonedPiece;
	return clonedPiece;
}

function getColor(piece) {
	if (!piece) return null;
	return piece.name.match(/white|black/)[0];
}

export {
	SerializeBoard,
	DeserializeBoard,
	moveChangesToBoardMaps,
	ClonePiece,
	createCaptureSq,
	getColor,
	FromResize,
};



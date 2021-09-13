import { Observable } from 'rxjs';
// import { debounceTime, map, filter, pairwise, startWith } from 'rxjs/operators';
import { debounceTime } from 'rxjs/operators';

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

function SerializeBoard(squares, pieces, captured){ // returns a boardMap to be deserialized into changes
	return {
		squares: Object.entries(squares).reduce((sqs, [sqName, { piece } ]) => (
			[...sqs, { sqName, piece }]
		), []),
		pieces: Object.entries(pieces()).reduce((pcs, [id, piece ]) => (
			{ ...pcs,  [id]:{ isEnabled: piece?.isEnabled()} } 
		), {}),
		captured
	}
}

function DeserializeBoard(boardMap, squares){ // returns list of square changes & map of pieces 
	return {
		sqChanges: [
			...resetCaptured(squares), // add changes that reset captured sqs; overwritten by boardMap's captured sqs
			...boardMap.squares.reduce((changes, { sqName, piece }) => (
				[ ...changes, { type: 'squares', name: sqName, piece} ]
			), [])
		],
		piecesMap: boardMap.pieces,
		captured: boardMap.captured
	}
}

function resetCaptured(squares){
	return Object.entries(squares).reduce((changes, [ name ]) =>(
		name.startsWith('cp') ? [...changes, { type: 'squares', name, piece: null }] : changes
	), [])
}

function ClonePiece({type, color, pieces}){
	// let origPiecesCount = {'p':8,'r':2,'n':2,'b':2,'q':1,'k':1} // todo allow recycle prev cloned piece
	let pieceId = `${type}_${color}`
	let firstPiece = pieces()[pieceId + '_1']
    let clonedPiece = firstPiece.clone(firstPiece.name +  '_clone')
	let count = Object.entries(pieces).filter(([id]) => id.startsWith(pieceId)).length;
	clonedPiece.makeGeometryUnique()
	clonedPiece.id = `${pieceId}_${count+1}_p` //_p indicates its promotion piece 
	return clonedPiece
}

export {
	SerializeBoard,
	DeserializeBoard,
	ClonePiece,
	FromResize
};



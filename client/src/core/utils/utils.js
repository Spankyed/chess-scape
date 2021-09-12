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

function SerializeBoard(squares){ 
	return Object.entries(squares).reduce((sqs, [sqName, { piece } ]) => (
		[...sqs, { sqName, piece}]
	), [])
}

function DeserializeBoard(squareMap, squares){ // produces list of changes for UPDATE event
	return [
		...resetCaptured(squares), // add changes that reset captured sqs; overwritten by squareMap
		...squareMap.reduce((changes, { sqName, piece }) => (
			[...changes, { type: 'squares', name: sqName, piece}]
		), [])
	]
}

function resetCaptured(squares){
	return Object.entries(squares).reduce((changes, [ name ]) => {
		if (name.startsWith('cp')) return ([...changes, { type: 'squares', name, piece: null}])
		else return changes
	}, [])
}

function ClonePiece({type, color, pieces}){
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



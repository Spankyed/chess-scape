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


// Input
//	[[{type:'r',color:'w'}, ...], Array(8), Array(8), ...]
// Output
//	{a1: "r_w", a2: "p_w", ...}
function MapBoard(board){
	let piecesCount = { 
		w: {'p':0,'r':0,'n':0,'b':0,'q':0,'k':0},
		b: {'p':0,'r':0,'n':0,'b':0,'q':0,'k':0}
	}
	let files = ['a','b','c','d','e','f','g','h']
	return board.reduce((rows, row, rIdx) => {
		let rowSquares = row.reduce((squares, piece, cIdx) => {
			let pieceId = '';
			let sq = files[cIdx] + (8-rIdx);
			if (piece){
				let count = ++piecesCount[piece.color][piece.type]
				pieceId = piece.type +'_'+ piece.color + (count > 1 ? '_'+ count : '')
			}
			return {...squares, [sq]: pieceId}
		},{})
		return {...rows, ...rowSquares}
	}, {});
}


export {
	MapBoard,
	FromResize
};
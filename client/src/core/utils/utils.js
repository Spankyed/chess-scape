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


function MapBoard(matrix){
	let map = {}
	let piecesCount = { 
		w: {'p':0,'r':0,'n':0,'b':0,'q':0,'k':0},
		b: {'p':0,'r':0,'n':0,'b':0,'q':0,'k':0}
	}
	let cols = ['a','b','c','d','e','f','g','h']
	matrix.forEach((row, i)=>{
		row.forEach((piece, j)=>{
			// console.log('mapping')
			let sq = cols[j] + (8-i)
			if(!piece) {
				map[sq] = null
				return
			}
			let count = ++piecesCount[piece.color][piece.type]
			let id = piece.type + '_' + piece.color + (count > 1 ? '_' + count : '')
			map[sq] = id
		})
	})
	return map
}

export {
	MapBoard,
	FromResize
};
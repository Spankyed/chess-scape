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

/*
**	Input [ [{..}, {..}, ...], [..], ...]
*	[ [{type:'r',color:'w'}, {type:'p',color:'w'}, ...], Array(8), Array(8), ...]
**	Output {...}
*	{ a1: "r_w", a2: "p_w", ...}
**
*/
// todo: to make reuseable, must first record captured pieces in piece count
function MapBoard(board){
	let piecesCount = { 
		w: {'p':0,'r':0,'n':0,'b':0,'q':0,'k':0},
		b: {'p':0,'r':0,'n':0,'b':0,'q':0,'k':0}
	}
	let files = ['a','b','c','d','e','f','g','h']
	return board.reduce((rows, row, rIdx) => {
		// for each row
		let rowSquares = row.reduce((squares, piece, sqIdx) => {
			// for each square
			let pieceId = '';
			let sq = files[sqIdx] + (8-rIdx);
			if (piece){
				let count = ++piecesCount[piece.color][piece.type]
				pieceId = piece.type +'_'+ piece.color + (count > 1 ? ('_'+ count) : '')
			}
			return {...squares, [sq]: pieceId}
		},{})
		return {...rows, ...rowSquares}
	}, {});
}

function ClonePiece({pieces, color, type}){
	let pieceId = `${type}_${color}`
	let clonedPiece = pieces[pieceId].clone(firstPiece.name +  '_clone')
	let count = Object.entries(pieces).filter(([id]) => id.startsWith(pieceId)).length;
	clonedPiece.makeGeometryUnique()
	clonedPiece.id = `${pieceId}_${count+1}_p` //_p indicates its promotion piece : change to _c
	return clonedPiece
}


export {
	MapBoard,
	ClonePiece,
	FromResize
};


// const boardMachine = createMachine({
//     id: 'board_states',
//     initial: 'started',
//     context: {
// 		players: {white:null, black:null}
//     },
//     states: {
// 		started: {
// 			on: {
// 				FETCH: 'loading'
// 			},
//             // after: {
//             //     1000: {
//             //         actions: sendParent('BOARD.READY')
//             //     }
//             // }
// 		},
// 		loading: {
// 			invoke: {
// 				id: 'fetchDog',
// 				src: (context, event) => 
// 					fetch('https://dog.ceo/api/breeds/image/random')
// 					.then((data) => data.json() ),
// 				onDone: {
// 					target: 'resolved',
// 					actions: assign({
// 						dog: (_, event) => event.data
// 					})
// 				},
// 				onError: 'rejected'
// 			},
// 			on: {
// 				CANCEL: 'idle'
// 			}
// 		},
// 		ended: {
// 			type: 'final'
// 		},
//     }
// });

// {
        // reviewing: {
		// 	on: {
        //         // 'MOVE': {
		// 		// 	actions: assign({ lastMove: (_, event) => event.value })
		// 		// },
        //         'END_REVIEW': 'moving',
        //         'OPP_MOVE': 'waiting' 
        //         // 'END': {
		// 		// 	actions: assign({ lastMove: (_, event) => event.value })
		// 		// }
		// 	}
		// },
		// WAITING: {
		// 	on: {
		// 		FETCH: 'loading'
		// 	}
		// },
        // on: {
        //     'REVIEW': 'reviewing'
        //     // 'REVIEW': {
        //     //     actions: assign({ currMove: (_, event) => event.value }),
        //     //     target: 'reviewing'
        //     // },
        // }



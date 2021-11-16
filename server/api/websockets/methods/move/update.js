// Example move: castle kingside
// {
//     "color": "w",
//     "from": "e1",
//     "to": "g1",
//     "flags": "k",
//     "piece": "k",
//     "san": "O-O"
// }
module.exports = function update(move, match) {
	const { from, to, piece, color, flags, promotion, captured: cap } = move;
	const { squares, pieces, captured } = match.state;

	const fromPiece = squares[from];
	const toPiece = squares[to];

	let changes = {
		squares: {
			[from]: null,
			[to]: fromPiece,
		},
	};

	const extend = (change) => {
		changes = {
			...changes,
			...Object.entries(change).reduce(
			(all, [target, values]) => ({
				...all,
				[target]: {
					...changes[target],
					...values,
				},
			}),
			{}
		)
	}};

	if (flags) {
		// p + c is only combination possible
		if (flags.includes("p"))
			extend(promotePawn(move, squares, pieces));
		if (flags.includes("e"))
			extend(captureEnPassant(to, squares, color, captured));
		else if (flags.includes("c"))
			extend(capture(toPiece, color, captured));
		else if ((castled = flags.match(/k|q/)))
			extend(moveCastledRook(castled[0], to, squares));
	}

	let stateChanges = Object.entries(changes).flatMap(
		([target, values]) => Object.entries(values).map(([name, val]) => [`state.${target}.${name}`, val]))
	
	return {
		move: changes,
		state: stateChanges.reduce(
			(rest, [target, val]) => ({
				...rest,
				[target]: val,
			}),
			{}
		),
	};
};

function promotePawn({ color, promotion, from, to }, squares, pieces) {
	let promoType = `${promotion}_${color}`;
	let count = Object.entries(pieces).filter(([id]) =>
		id.startsWith(promoType)
	).length;
	promoID = `${promoType}_${count + 1}_p`; //_p indicates its promo piece
	let pawn = squares[from];
	return {
		pieces: {
			[promoID]: true,
			[pawn]: false,
		},
		squares: {
			[to]: promoID,
		},
	};
}

function captureEnPassant(to, squares, color, captured) {
	let rankOffSet = { 6: 5, 3: 4 }; // possible ranks for captured piece, relative to capturing piece
	let file = to.charAt(0);
	let rank = to.charAt(1);
	let capturedPieceSq = file + rankOffSet[rank];
	return capture(squares[capturedPieceSq], color, captured);
}

function capture(piece, color, captured) {
	oppColor = color == "w" ? "black" : "white";
	let newCount = ++captured[oppColor];
	let capSq = `cp_${newCount}_${oppColor}`;
	return {
		squares: { [capSq]: piece },
		captured: { [oppColor]: newCount }
	}
}

function moveCastledRook(side, kingSq, squares) {
	let rank = kingSq.charAt(1);
	let rookFiles = { q: ["a", "d"], k: ["h", "f"] }; // q: queenside[from,to], k:  kingside[from,to]
	let sqs = rookFiles[side].map((file) => file + rank);
	return {
		squares: {
			[sqs[0]]: null,
			[sqs[1]]: squares[sqs[0]],
		},
	};
}
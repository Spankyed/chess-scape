import { Chess } from 'chess.js';
import Api from '../api/Api'; 

export default class Game {
	constructor(current, roomID) {
		this.Scene = current;
		this.board = current.board;
		this.roomID = roomID;
		this.isVsComputer = false;
		// this.mainPlayer = scene;
		// this.opponentPlayer = canvas;
		// this.computerColor = 'black';
		this.playerColor = null;
		// this.game_over = false;
		this.engine = new Chess();
		this.reviewEngine = new Chess();
		this.inReview = (_) =>
			this.board().moveService.state.matches("reviewing");
		return this;
	}
	getCurrentEngine(isOpponentMove) {
		return this.inReview() && !isOpponentMove
			? this.reviewEngine
			: this.engine;
	}

	makeMove(move, isOpponentMove) {
		return this.appendIfChecked(this.getCurrentEngine(isOpponentMove).move(move));
	}
	async handlePlayerMove(move) {
		// console.log('checking',{move})
		let validMove = null;
		if (!this.inReview() && this.engine.turn() != this.playerColor?.charAt(0)) {
			// todo: sync player
			return validMove;
		}
		if (this.isPromoting(move)) {
			const piece = await this.promptPieceSelect();
			validMove = piece
				? this.makeMove({ ...move, promotion: piece })
				: null;
		} else {
			validMove = this.makeMove(move);
		}
		if (validMove && !this.inReview()) {
			if (this.isVsComputer) {
				this.makeRandomMove();
			} else {
				Api.sendMove(validMove);
			}
		}
		return validMove;
	}
	handleOpponentMove(move) {
		if (!move) return;
		var validMove = this.makeMove(move, true);
		if (!validMove) return; // todo: should make request to sync player boards or invalidate game
		this.board().moveService.send({ type: "OPP_MOVE", value: validMove });
		// console.log('opponent move', validMove)
	}
	makeRandomMove() {
		// console.log('turn', this.engine.turn())
		// if (this.engine.turn() != 'b') return
		const moves = this.engine.moves({ verbose: true });
		const move = moves[Math.floor(Math.random() * moves.length)]; // get random move
		if (move) {
			setTimeout((_) => {
				let validMove = this.makeMove(move, true);
				if (validMove)
					this.board().moveService.send({
						type: "OPP_MOVE",
						value: validMove,
					});
				// console.log('computer move', validMove)
			}, 3000);
		}
	}
	appendIfChecked(validMove){
		if (!validMove || !this.getCurrentEngine().in_check()) return validMove;
		return { ...validMove, inCheck: true };
	}
	isPromoting(move) {
		let engine = this.getCurrentEngine();
		if (!move.to?.match(/1|8/)) return false;
		const piece = engine.get(move.from);
		if (piece?.type !== "p") return false;
		return (
			engine
				.moves({ verbose: true })
				.filter(
					(m) =>
						m.from === move.from &&
						m.to === move.to &&
						m.flags.includes("p")
				).length > 0
		);
	}
	promptPieceSelect() {
		const color = this.playerColor;
		return new Promise((resolve, reject) =>
			this.Scene.uiActions.controls.openPieceSelect({
				resolve,
				reject,
			})
		);
	}
	// getCapturePieces(color) {
	//     const captured = {'p': 0, 'n': 0, 'b': 0, 'r': 0, 'q': 0}
	//     for (const move of this.engine.history({ verbose: true })) {
	//         if (move.hasOwnProperty("captured") && move.color !== color) {
	//             captured[move.captured]++
	//         }
	//     }
	//     return captured
	// }
}


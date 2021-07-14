import { Chess } from 'chess.js';
import Api from '../api/Api'; 

export default class Game {
    constructor(Scene, gameId){
        // Game class depends on players/pieces being created
        // super()
        // this.mainPlayer = scene;  
        // this.opponentPlayer = canvas;  
        this.Scene = Scene
        this.isVsComputer = false;
        this.computerColor = 'black';
        this.game_over = false;
        this.engine = new Chess()
        // console.log('moves', this.engine.moves())

        this.setupWebhookHandlers()
        this.gameId = gameId

        return this
    }

    setupWebhookHandlers() {
        console.log('setting up webhh')
        Api.setMessageHandlers({
            // join: this.onJoin, 
            move: this.onServerMove.bind(this), 
            // chat: this.onChat,
        })
    }

    onServerMove({move}){
        if (move) this.Scene.board.moveOpponentPiece(move)
    }

    handleMove (move) {
        var validMove = this.engine.move(move);
        if (!validMove) return
        if (this.isVsComputer) {
            this.makeComputerMove()
        } else {
            Api.sendMove(move, this.gameId)
        }
        
        if (this.engine.game_over()) this.game_over = true
        // if (move === null)  return 'snapback';
        // else socket.emit('move', move);
        return validMove
    }

    makeComputerMove(){
        // console.log('turn', this.engine.turn())
        if(this.engine.turn() != 'b') return
        const moves = this.engine.moves()
        const move = moves[Math.floor(Math.random() * moves.length)]
        var validMove = this.engine.move(move, { verbose: true })
        if (validMove) setTimeout(()=> this.Scene.board.moveOpponentPiece(validMove), 10)
    }

    getValidMoves() {
        //should never return an opponent move
        return validMoves
    }

    // getMovesFromSq(sq) {
    //     return this.engine.moves(sq)
    // }

    handleGameOver(){
        this.piecesContainer.removeAllFromScene()
    }

    isPromoting(fen, move) {
        const chess = new Chess(fen);
        const piece = chess.get(move.from);
        if (piece?.type !== "p") return false;
        if (piece.color !== chess.turn()) return false;
        if (!["1", "8"].some((it) => move.to.endsWith(it))) return false;
        return chess
          .moves({ square: move.from, verbose: true })
          .map((it) => it.to)
          .includes(move.to);
    }
}


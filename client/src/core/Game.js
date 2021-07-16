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
        console.log('bind socket handlers')
        Api.setMessageHandlers({
            // join: this.onJoin, 
            move: this.onServerMove.bind(this), 
            // chat: this.onChat,
        })
    }

    makeComputerMove(){
        // console.log('turn', this.engine.turn())
        if(this.engine.turn() != 'b') return
        const moves = this.engine.moves()
        const move = moves[Math.floor(Math.random() * moves.length)]
        var validMove = this.engine.move(move, { verbose: true })
        if (validMove) setTimeout(()=> this.Scene.board.moveOpponentPiece(validMove), 10)
        this.checkGameOver()
    }

    onServerMove({move}){
        if (!move) return
        var validMove = this.engine.move(move);
        console.log('server move', validMove)
        if (!validMove) return
        this.Scene.board.moveOpponentPiece(move)
        this.checkGameOver()
    }

    handleUserMove (move) {
        var validMove = this.engine.move(move);
        if (!validMove) return
        if (this.isVsComputer) {
            this.makeComputerMove()
        } else {
            Api.sendMove(move, this.gameId)
        }
        
        this.checkGameOver()
        // if (move === null)  return 'snapback';
        // else socket.emit('move', move);
        return validMove
    }

    checkGameOver(){
        if (this.engine.game_over()) {
            this.game_over = true
            this.Scene.uiActions.endGame()
            // this.piecesContainer.removeAllFromScene()
        }
    }

    getValidMoves() {
        //should never return an opponent move
        return validMoves
    }

    // getMovesFromSq(sq) {
    //     return this.engine.moves(sq)
    // }


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


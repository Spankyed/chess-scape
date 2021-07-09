import { Chess } from 'chess.js';
import Api from '../api/Api'; 

export default class Game {
    constructor(Scene){
        // Game class depends on players/pieces being created
        // super()
        // this.mainPlayer = scene;  
        // this.opponentPlayer = canvas;  
        this.Scene = Scene
        this.isVsComputer = true;
        this.computerColor = 'black';
        this.game_over = false;
        this.engine = new Chess()
        // this.move('b4')
        // this.move('b6')
        this.setupWebhookHandlers()
        console.log('moves', this.moves())
        
        return this
    }

    setupWebhookHandlers() {
        Api.setMessageHandlers({
            // join: this.onJoin, 
            move: this.onMove, 
            // chat: this.onChat,
        })
    }

    onMove({move}){
        if (move) this.Scene.board.moveOpponentPiece(move)
    }

    moves(sq) {
        return this.engine.moves(sq)
    }


    handleMove (move) {
        var validMove = this.engine.move(move);

        if (validMove && this.isVsComputer) this.makeComputerMove()
        
        if (this.engine.game_over()) this.game_over = true
        // if (move === null)  return 'snapback';
        // else socket.emit('move', move);
        return validMove
    }

    makeComputerMove(){
        // console.log('turn', this.engine.turn())
        if(this.engine.turn() != 'b') return
        const moves = this.moves()
        const move = moves[Math.floor(Math.random() * moves.length)]
        var validMove = this.engine.move(move, { verbose: true })
        console.log('computer move',validMove)
        if (validMove) this.Scene.board.moveOpponentPiece(validMove)
    }


    // remove scene and ground
    getValidMoves() {
        //should never return an opponent move
        return validMoves
    }

    handleGameOver(){
        this.piecesContainer.removeAllFromScene()
    }

}


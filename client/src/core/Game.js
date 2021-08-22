import { Chess } from 'chess.js';
import Api from '../api/Api'; 

export default class Game {
    constructor(current, gameId){
        // Game class depends on players/pieces being created
        // super()
        // this.mainPlayer = scene;  
        // this.opponentPlayer = canvas;  
        this.Scene = current
        this.board = current.board
        this.gameId = gameId
        this.isVsComputer = true;
        // this.computerColor = 'black';
        this.playerColor = 'black';
        this.game_over = false;
        this.engine = new Chess()
        // console.log('moves', this.engine.moves())
        this.inReview = false;
        this.beforeReview = null;

        this.setupWebhookHandlers()

        return this
    }
    setupWebhookHandlers() {
        // console.log('bind socket handlers')
        Api.setMessageHandlers({
            // join: this.onJoin, 
            move: this.onServerMove.bind(this), 
            // chat: this.onChat,
        })
    }
    makeComputerMove(){
        // console.log('turn', this.engine.turn())
        if (this.engine.turn() != 'b') return
        const moves = this.engine.moves()
        const move = moves[Math.floor(Math.random() * moves.length)]
        var validMove = this.engine.move(move, { verbose: true })
        if (validMove) setTimeout(()=> this.board().moveOpponentPiece(validMove), 10)
        this.checkGameOver()
    }
    onServerMove({move}){
        if (!move) return
        var validMove = this.engine.move(move);
        console.log('server move', validMove)
        if (!validMove) return
        this.board().moveOpponentPiece(move)
        this.checkGameOver()
    }
    resumePlay(){
        this.engine.load_pgn(this.beforeReview)
        this.board().setBoard(this.engine.board())
        this.inReview = false
        this.beforeReview = null
        this.Scene.uiActions.endReview()
    }
    setReview(gamePosition) {
        this.beforeReview = this.engine.pgn()
        this.engine.load_pgn(gamePosition)
        this.board().setReviewPosition(this.engine.board())
    }
    mapBoard(matrix){
        let map = {}
        let cols = ['a','b','c','d','e','f','g','h']
        matrix.forEach((row, i)=>{
            col.forEach((piece, j)=>{
                let sq = cols[j] + (8-i)
                if (piece){}
                map[0]
                rook
                knight
            })
        })

        let col = 0
        for (let row = 8; row < 0; row--) {
            let sq = letters[col] + row
            col++
        }
        for (let row = 0; row < grid.h; row++) {
            let xCoord = -7

        }

    }
    handleUserMove (move) {
        var validMove = this.engine.move(move);
        // if (!validMove) return
        if (this.isVsComputer) {
            this.makeComputerMove()
        } else {
            Api.sendMove(move, this.gameId)
        }

        // if(!this.inReview) this.Scene.uiActions.addMove(this.engine.pgn())
        
        this.checkGameOver()
        // if (move === null)  return 'snapback';
        // else socket.emit('move', move);
        return validMove
    }
    checkGameOver(){
        // todo: if gameover how 'time/checkmate/3foldrep...'
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


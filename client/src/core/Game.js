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
        this.tempEngine = new Chess()
        this.inReview = false;
        // this.beforeReview = null;

        this.setupWebhookHandlers()

        return this
    }
    setupWebhookHandlers() {
        // console.log('bind socket handlers')
        Api.setMessageHandlers({
            // join: this.onJoin, 
            move: this.handleServerMove.bind(this), 
            // chat: this.onChat,
        })
    }
    makeMove(move){
        let engine = this.inReview ? this.tempEngine : this.engine
        let validMove = engine.move(move);
        // let validMove = this.engine.move(move, { verbose: true });
        // console.log('pgn/fen',{pgn:this.engine.pgn(),fen:this.engine.fen()})
        if (validMove && !this.inReview) this.addMoveForReview(validMove)
        return validMove
    }
    handleUserMove (move) {
        let validMove = this.makeMove(move);
        if (!validMove) return validMove
        console.log('player move', validMove)
        if (this.inReview) return validMove
        if (this.isVsComputer) {
            this.handleComputerMove()
            // Api.getComputerMove()
        } else {
            Api.sendMove(move, this.gameId)
            // Api.sendMove(validMove, this.gameId)
        }
        this.checkGameOver()
        // if (move === null)  return 'snapback';
        // else socket.emit('move', move);
        return validMove
    }
    handleComputerMove(){
        // console.log('turn', this.engine.turn())
        if (this.engine.turn() != 'b') return
        const moves = this.engine.moves()
        const move = moves[Math.floor(Math.random() * moves.length)] // get random move
        var validMove = this.makeMove(move)
        if (validMove) setTimeout(_=> this.board().moveOpponentPiece(validMove), 10)
        console.log('computer move', validMove)
        this.checkGameOver()
    }
    handleServerMove({move}){
        if (!move) return
        if (this.inReview) this.resumePlay() 
        var validMove = this.makeMove(move);
        if (!validMove) return
        // console.log('opponent move', validMove)
        this.board().moveOpponentPiece(move)
        this.checkGameOver()
    }
    addMoveForReview(move){
        this.Scene.uiActions.sidePanel.moves.addMove({move, fen: this.engine.fen()})
    }
    mapBoard(matrix){
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
    setReview(gamePosition) {
        // this.beforeReview = this.engine.fen()
        this.tempEngine.load(gamePosition)
        let boardMap = this.mapBoard(this.tempEngine.board())
        this.board().setBoardPosition(boardMap)
        this.inReview = true
    }
    resumePlay(){
        // this.engine.load(this.beforeReview)
        let boardMap = this.mapBoard(this.engine.board())
        this.board().setBoardPosition(boardMap)
        this.inReview = false
        // this.beforeReview = null
        // this.Scene.uiActions.sidePanel.moves.endReview()
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


import { Chess } from 'chess.js';
import Api from '../api/Api'; 
import { MapBoard } from './utils/utils'; 

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
        // console.log('player move', validMove)
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
    handleServerMove({move}){
        if (!move) return
        if (this.inReview) this.resumePlay() // end review if opponent makes moves 
        var validMove = this.makeMove(move);
        if (!validMove) return
        // console.log('opponent move', validMove)
        this.board().moveOpponentPiece(move)
        this.checkGameOver()
    }
    handleComputerMove(){
        // console.log('turn', this.engine.turn())
        if (this.engine.turn() != 'b') return
        const moves = this.engine.moves()
        const move = moves[Math.floor(Math.random() * moves.length)] // get random move
        var validMove = this.makeMove(move)
        if (validMove) setTimeout(_=> this.board().moveOpponentPiece(validMove), 10)
        // console.log('computer move', validMove)
        this.checkGameOver()
    }
    addMoveForReview(move){
        this.Scene.uiActions.sidePanel.moves.addMove({move, fen: this.engine.fen()})
    }

    setReview(gamePosition) {
        this.tempEngine.load(gamePosition)
        let boardMap = MapBoard(this.tempEngine.board())
        this.board().setBoardPosition(boardMap)
        this.inReview = true
    }
    resumePlay(){
        this.Scene.uiActions.alert.hide()
        this.Scene.uiActions.sidePanel.moves.endReview()
        let boardMap = MapBoard(this.engine.board())
        this.board().setBoardPosition(boardMap)
        this.inReview = false
    }
    checkGameOver(){
        // todo: if gameover how 'time/checkmate/3foldrep...'
        if (this.engine.game_over()) {
            this.game_over = true
            this.Scene.uiActions.endGame()
            this.piecesContainer.removeAllFromScene()
        }
    }
    // getValidMoves() {
    //     // should not return opponent moves
    //     return validMoves
    // }
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

    // let move = `{"${this.startingSq.sqName}:"${closestSq.sqName}"}`
    // let pieceAbbrev = this.getPieceNameAbbrev(this.selectedPiece)
    // isMoveValid(from, to){
    //     let pieceAbbrev = this.getPieceNameAbbrev(this.selectedPiece)
    //     return !!this.game.moves({ square: from }).find((move) => {
    //         if (pieceAbbrev == '') 
    //         {    // todo: in pgn, check when pawn captures, if its starting sq changes file
    //             return move.startsWith(`${from.charAt(0)}x${to}`) 
    //         }
    //         else 
    //             return move.startsWith(`${this.selectedPiece.name.charAt(0)}${to}`) 
    //     }) 
    // }

    // getPieceNameAbbrev(piece){
    //     let abbrev = piece.name.charAt(0)
    //     return (abbrev != 'P') ? abbrev : ''
    // }

    // this.game().moves().find((move) => {
    //     if (move.isPromiting){    
    //         this.Scene.uiActions.showPromotionUI() 
    //     }
    // }) 
}


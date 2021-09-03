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
    checkMove(move){
        console.log('checking',{move})
        // issa copy of function below
        let engine = this.inReview ? this.tempEngine : this.engine
        let validMove, piece;
        if (this.isPromoting(move)) { 
            // const piece = await this.promptPieceSelect()
            validMove = piece ? engine.move({ ...move, promotion: piece }) : null
        } else {
            validMove = engine.move(move)
        }
        //moved to board
        // if (validMove && !this.inReview) this.addMoveForReview(validMove)
        return validMove
    }
    async makeMove(move, fromServer = false){
        let engine = this.inReview ? this.tempEngine : this.engine
        let validMove;
        if (!fromServer && this.isPromoting(move)) { 
            const piece = await this.promptPieceSelect()
            validMove = piece ? engine.move({ ...move, promotion: piece }) : null
        } else {
            validMove = engine.move(move)
        }
        //moved to board
        // if (validMove && !this.inReview) this.addMoveForReview(validMove)
        return validMove
    }
    async handleUserMove (move) {
        let validMove = await this.makeMove(move);
        if (!validMove) return validMove
        // console.log('player move', validMove)
        if (this.inReview) return validMove
        if (this.isVsComputer) {
            this.handleComputerMove()
            // Api.getComputerMove()
        } else {
            Api.sendMove(validMove, this.gameId)
        }
        this.checkGameOver()
        // if (move === null)  return 'snapback';
        // else socket.emit('move', move);
        return validMove
    }
    async handleServerMove({move}){
        if (!move) return
        if (this.inReview) this.resumePlay() // end review if opponent makes moves 
        var validMove = await this.makeMove(move, true);
        if (!validMove) return // todo: should make request to sync player boards
        // console.log('opponent move', validMove)
        this.board().moveOpponentPiece(move)
        this.checkGameOver()
    }
    async handleComputerMove(){
        // console.log('turn', this.engine.turn())
        if (this.engine.turn() != 'b') return
        const moves = this.engine.moves({verbose:true})
        const move = moves[Math.floor(Math.random() * moves.length)] // get random move
        if(move){
            var validMove = await this.makeMove(move)
            if (validMove) setTimeout(_=> this.board().moveOpponentPiece(validMove), 10)
            // console.log('computer move', validMove)
            this.checkGameOver()
        }
    }

    setReview({fen, boardMap}) {
        this.tempEngine.load(fen)
        this.board().setBoardPosition(boardMap)
        this.board().inReview = true
        this.inReview = true
    }
    resumePlay(){
        this.Scene.uiActions.alert.hide()
        this.Scene.uiActions.sidePanel.moves.endReview()
        this.board().setBoardPosition(null, true)
        this.inReview = false
    }
    checkGameOver(){
        // todo: if gameover how 'time/checkmate/3foldrep...'
        if (this.engine.game_over()) {
            this.game_over = true
            this.Scene.uiActions.endGame()
            // this.piecesContainer.removeAllFromScene()
        }
    }
    isPromoting(move) {
        // if(!move) debugger
        if(!move.to?.match(/1|8/)) return false;
        const piece = this.engine.get(move.from);
        if (piece?.type !== "p") return false;
        // if (piece.color !== this.engine.turn()) return false; // dont think this is needed
        return this.engine.moves({ verbose: true }).filter(m =>    
            m.from === move.from && 
            m.to === move.to &&
            m.flags.includes('p')
        ).length > 0
    }
    promptPieceSelect() {
        return new Promise(this.Scene.uiActions.controls.openPieceSelect)
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


import { Chess } from 'chess.js';
import Api from '../api/Api'; 

export default class Game {
    constructor(current, gameId){
        this.Scene = current
        this.board = current.board
        this.gameId = gameId
        this.isVsComputer = false;
        // this.mainPlayer = scene;  
        // this.opponentPlayer = canvas;  
        // this.computerColor = 'black';
        // this.playerColor = 'black';
        // this.game_over = false;
        this.engine = new Chess()
        this.reviewEngine = new Chess()
        this.inReview = _ => this.board().moveService.state.matches('reviewing');
        this.setupWebhookHandlers()
        return this
    }
    setupWebhookHandlers() {
        // console.log('bind socket handlers')
        Api.setMessageHandlers({
            // join: this.onJoin, 
            move: this.handleOpponentMove.bind(this), 
            resign: this.handleOpponentMove.bind(this), 
            draw: this.handleOpponentMove.bind(this), 
            // chat: this.onChat,
        })
    }
    getCurrentEngine(isOpponentMove){
        return (this.inReview() && !isOpponentMove) ? this.reviewEngine : this.engine
    }
    makeMove(move, isOpponentMove){
        return this.getCurrentEngine(isOpponentMove).move(move)
    }
    async handlePlayerMove(move){
        // console.log('checking',{move})
        let validMove = null;
        if (this.isPromoting(move)) { 
            const piece = await this.promptPieceSelect()
            validMove = piece ? this.makeMove({ ...move, promotion: piece }) : null
        } else {
            validMove = this.makeMove(move)
        }
        if (validMove && !this.inReview()){
            if (this.isVsComputer) {
                this.makeRandomMove()
            } else {
                Api.sendMove(validMove, this.gameId)
            }
            this.checkGameOver()
        }

        return validMove
    }
    handleOpponentMove({move}){
        if (!move) return
        var validMove = this.makeMove(move, true);
        if (!validMove) return // todo: should make request to sync player boards or invalidate game
        this.board().moveService.send({type:'OPP_MOVE', value: validMove})
        // console.log('opponent move', validMove)
        this.checkGameOver()
    }
    makeRandomMove(){
        // console.log('turn', this.engine.turn())
        // if (this.engine.turn() != 'b') return
        const moves = this.engine.moves({verbose:true})
        const move = moves[Math.floor(Math.random() * moves.length)] // get random move
        if(move){
             setTimeout(_=> {
                let validMove = this.makeMove(move, true)
                if (validMove)
                    this.board().moveService.send({type:'OPP_MOVE', value: validMove})
                // console.log('computer move', validMove)
            }, 3000)
        }
    }
    checkGameOver(){
        // todo: if gameover indicate how: 'time/checkmate/3foldrep...'
        if (this.engine.game_over()) {
            this.Scene.uiActions.endGame()
            // this.piecesContainer.removeAllFromScene()
        }
    }
    
    endGame(info){ // { winningColor: white || black, way: resign || draw || abandon}
        // this.engine.reset()
        // this.game_over = true
        this.Scene.uiActions.endGame(info)
        // todo highlight losers kingSq white
    }
    isPromoting(move) {
        let engine = this.getCurrentEngine()
        if(!move.to?.match(/1|8/)) return false;
        const piece = engine.get(move.from);
        if (piece?.type !== "p") return false;
        return engine.moves({ verbose: true }).filter(m =>    
            m.from === move.from && 
            m.to === move.to &&
            m.flags.includes('p')
        ).length > 0
    }
    promptPieceSelect() {
        return new Promise(this.Scene.uiActions.controls.openPieceSelect)
    }

    abandon(){
        Api.sendMove('abandon', this.gameId)
    }
    resign(){
        Api.sendMove('resign', this.gameId)
    }
    offerDraw(){
        Api.sendMove('offer_draw', this.gameId)
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


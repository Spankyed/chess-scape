import { Chess } from 'chess.js';
import Api from '../api/Api'; 

export default class Game {
    constructor(Scene, gameId){
        // Game class depends on players/pieces being created
        // super()
        // this.mainPlayer = scene;  
        // this.opponentPlayer = canvas;  
        this.Scene = Scene
        this.board = Scene.board
        this.gameId = gameId
        this.isVsComputer = true;
        // this.computerColor = 'black';
        this.playerColor = 'black';
        this.game_over = false;
        this.engine = new Chess()
        // console.log('moves', this.engine.moves())
        this.inReview = false;
        this.pausedPgn = null;

        this.setupWebhookHandlers()
        window.interact = {engine: this.engine, scene: this.Scene, game:this}

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
        if(this.engine.turn() != 'b') return
        const moves = this.engine.moves()
        const move = moves[Math.floor(Math.random() * moves.length)]
        var validMove = this.engine.move(move, { verbose: true })
        if (validMove) setTimeout(()=> this.Scene.board().moveOpponentPiece(validMove), 10)
        this.checkGameOver()
    }

    onServerMove({move}){
        if (!move) return
        var validMove = this.engine.move(move);
        console.log('server move', validMove)
        if (!validMove) return
        this.Scene.board().moveOpponentPiece(move)
        this.checkGameOver()
    }

    resumePlay(){
        this.engine.load_pgn(this.pausedPgn)
        this.Scene.setBoard(chess.board())
        this.inReview = false
        his.pausedPgn = null
    }
    setReview(sq) {
        return this.engine.moves(sq)
        this.pausedPgn = this.engine.pgn()
    }
    
    // mapBoard(matrix){
    //     let map = {}
    //     let cols = ['a','b','c','d','e','f','g','h']
    //     matrix.forEach((row, i)=>{
    //         col.forEach((piece, j)=>{
    //             let sq = cols[j] + (8-i)
    //             if (piece)
    //             map[]
    //             rook
    //             knight
    //         })
    //     })

    //     let col = 0
    //     for (let row = 8; row < 0; row--) {
    //         let sq = letters[col] + row
    //         col++
    //     }
    //     for (let row = 0; row < grid.h; row++) {
    //         let xCoord = -7

    //     }

    // }


    handleUserMove (move) {
        var validMove = this.engine.move(move);
        // if (!validMove) return
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


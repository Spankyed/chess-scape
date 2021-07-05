import { Chess } from 'chess.js';

export default class Game extends Chess {
    constructor(scene, canvas){
        // Game class depends on players/pieces being created
        super()
        this.scene = scene;  
        this.canvas = canvas;  

        // this.move('b4')
        // this.move('b6')
        console.log('moves', this.moves())
    }
    
    setupEventListeners(scene, canvas) {
        return scene;
    };
    // remove scene and ground
    getValidMoves() {
        //should never return an opponent move
        return validMoves
    }

    handleGameOver(){
        this.piecesContainer.removeAllFromScene()
    }

}


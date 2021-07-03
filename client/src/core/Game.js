import { Chess } from 'chess.js';

export default class Game extends Chess {
    constructor(scene, canvas){
        super()
        this.scene = scene;  
        this.canvas = canvas;  
    }
    
    setupEventListeners(scene, canvas) {
        return scene;
    };
    // remove scene and ground
    getValidMoves() {
     return validMoves
    }
}


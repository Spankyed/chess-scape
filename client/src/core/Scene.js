import SceneManager from './utils/SceneManager';
import utils from './utils/utils'; 
import Board from './board/Board';
import Game from './Game';
import loadPieces  from './Pieces'; 
// import { Scene, Engine } from 'babylonjs';

const Scene = new class {
    constructor(){
        this.uiActions = {};   
        this.canvas;  
        this.engine;  
        this.scene = null;
        this.game = _=> this._game;
        this.board = _=> this._board;
        this.pieces = _=> this._pieces;
        this.assetsManager;
    }
    async setupGame(canvas, actions, gameId){
        // todo: add playerColor arg
        if(!canvas) console.warn('No canvas found')
        // this.uiActions = actions;
        let engine = new BABYLON.Engine(canvas, true);
        let scene = SceneManager.CreateScene(engine, canvas, true)
        engine.loadingScreen = { displayLoadingUI: actions.showLoader, hideLoadingUI: actions.hideLoader }
        engine.displayLoadingUI()
        // this.canvas = canvas
        scene.manager.setEnv(canvas)
        // let board = new Board(this, scene, canvas); // dont use new
        let board = Board(this, scene, canvas); // dont use new
        let game = new Game(this, gameId);
        let [pieces, piecesMap] = await loadPieces(scene)
        board.mapPiecesToSquares(pieces)
        // this.modelsLoaded = true;
        // todo: fetch or set initial game state
        engine.hideLoadingUI()
        // todo: begin camera animation
        // todo: signal to server player is ready. Used for syncing start timing

        engine.runRenderLoop(_ => scene.render()) // todo: manually render scene updates with ferp app({observe})

        window.interact = {engine: engine, scene: this, game, board}

        Object.assign(this, {
            canvas, engine, scene,  
            _game: game, _board: board, _pieces: piecesMap,
            uiActions: actions, 
        });
    }

    // methods below not used

    // openPromotionUI(){ 
    //     this.uiActions.showPromotionUI(); 
    // }
    // hideLoader(){
    //     this.engine.hideLoadingUI()
    // }
}

export default Scene;
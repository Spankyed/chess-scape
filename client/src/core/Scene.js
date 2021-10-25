import SceneManager from './utils/SceneManager';
import utils from './utils/utils'; 
import Board from './board/Board';
import Game from './Game';
import loadPieces  from './Pieces'; 
import { delay } from "nanodelay";
// import Api from '../api/Api'; 
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
        // this.onReady = _ => {};
        this.assetsManager;
    }
    async setupGame(canvas, actions, roomID){
        // todo: add playerColor arg
        if(!canvas) console.warn('No canvas found')
        // this.uiActions = actions;
        let engine = new BABYLON.Engine(canvas, true);
        let scene = SceneManager.CreateScene(engine, canvas, true)
        engine.loadingScreen = {
			displayLoadingUI: actions.loader.showLoader,
			hideLoadingUI: actions.loader.hideLoader,
		};
        engine.displayLoadingUI()
        // this.canvas = canvas
        scene.manager.setEnv(canvas)
        // let board = new Board(this, scene, canvas); // dont use new
        let board = Board(this, scene, canvas); // dont use new
        let game = new Game(this, roomID);
        let [pieces, piecesMap] = await loadPieces(scene)
        board.mapPiecesToSquares(pieces)
        // this.modelsLoaded = true;

        engine.runRenderLoop(_ => scene.render()) // todo: manually render loop scene updates with xstate activities?
        // delay(200).then(_=> engine.hideLoadingUI());
        engine.hideLoadingUI();
        window.interact = { engine: engine, scene: this, game, board }

        Object.assign(this, {
            canvas, engine, scene,
            manager: scene.manager,
            _game: game, _board: board, _pieces: piecesMap,
            uiActions: actions, 
        });

        // this.onReady()
    }
}

export default Scene;
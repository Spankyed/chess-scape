// import { delay } from "nanodelay";
import { Engine } from "@babylonjs/core/Engines/engine";
import SceneManager from "./utils/SceneManager";
import Board from './board/Board';
import Game from './Game';
import loadPieces  from './Pieces'; 
// import utils from './utils/utils'; 
// import Api from '../api/Api'; 

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
	async setupGame({canvas, actions, roomID}) {
		try {
			// todo: add playerColor arg
			if (!canvas) console.warn("No canvas found");
			// this.uiActions = actions;
			let engine = new Engine(canvas, true);
			let scene = SceneManager.CreateScene(engine, canvas, true);
			engine.loadingScreen = {
				displayLoadingUI: actions.loader.showLoader,
				hideLoadingUI: actions.loader.hideLoader,
			};
			engine.displayLoadingUI();
			// this.canvas = canvas
			scene.manager.setEnv(canvas);
			// let board = new Board(this, scene, canvas); // dont use new
			let board = Board(this, scene, canvas); // dont use new
			let game = new Game(this, roomID);
			let [pieces, piecesMap] = await loadPieces(scene);
			board.mapPiecesToSquares(pieces);
			// this.modelsLoaded = true;
			engine.hideLoadingUI();
			// delay(200).then(_=> engine.hideLoadingUI());

			Object.assign(this, {
				canvas,
				engine,
				scene,
				manager: scene.manager,
				_game: game,
				_board: board,
				_pieces: piecesMap,
				uiActions: actions,
			});

			window.interact = { engine: engine, scene: this, game, board };

			engine.runRenderLoop((_) => scene.render()); // todo: manually render loop scene updates with xstate activities?
			// this.onReady()

			return scene
		} catch (err) {
			console.warn("Issue setting up scene");
			console.error(err);
		}
	}
}

export default Scene;
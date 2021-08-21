import SceneManager from './utils/SceneManager';
import utils from './utils/utils'; 
import Board from './Board';
import Game from './Game';
import loadPieces  from './Pieces'; 

const Scene = new class {
    constructor(){
        this.uiActions = {};   
        this.canvas;  
        this.scene = null;
        this.engine;  
        this.game = _=> this._game;
        this.board = _=> this._board;
        this.pieces = {white:[],black:[]}
        this.assetsManager;
    }

    async setupGame(canvas, actions, gameId){
        if(!canvas) console.warn('no canvas found')
        // this.uiActions = actions;
        let engine = new BABYLON.Engine(canvas, true);
        let scene = SceneManager.CreateScene(engine, canvas, true)
        engine.loadingScreen = {
            displayLoadingUI: _ => actions.showLoader(),
            hideLoadingUI: _ => actions.hideLoader() 
        };

        engine.displayLoadingUI()
        // this.canvas = canvas
        scene.manager.setEnv(this.canvas)
        let board = new Board(this, scene, canvas);
        let game = new Game(this, gameId);
        let pieces = await loadPieces(scene)
        board.mapPiecesToSquares(pieces)
        // this.modelsLoaded = true;


        engine.hideLoadingUI()
        // todo: begin camera animation


        engine.runRenderLoop(_ => scene.render())

        Object.assign(this, {
            _game: game, _board: board,
            canvas, scene, engine, 
            uiActions: actions, 
        });
    }
    
    openPromotionUI(){
        this.uiActions.showPromotionUI(); 
    }
    
    hideLoader(){
        this.engine.hideLoadingUI()
    }

}


export default Scene;
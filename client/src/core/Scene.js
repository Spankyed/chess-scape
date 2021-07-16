import SceneManager from './utils/SceneManager';
import utils from './utils/utils'; 
import Board from './Board';
import Game from './Game';
import Player from './Player'; 

const Scene = new class {
    constructor(){
        this.scene = null;
        this.uiActions = {};   
        this.game; 
        this.Board; 
        this.pieces = {white:[],black:[]}
        this.assetsManager;
    }

    setupGame(canvas, actions, gameId){
        if(!canvas) console.warn('no canvas found')
        this.uiActions = actions;
        let _this = this;
        this.engine = new BABYLON.Engine(canvas, true);
        this.scene = SceneManager.CreateScene(this.engine, true)
        this.canvas = canvas

        this.setupLoader()
        this.engine.displayLoadingUI()
        this.loadPieces()
        // let shadowGenerator = this.scene.manager.setEnv(canvas)
        this.scene.manager.setEnv(this.canvas)

        // let whitePlayer = new Player(this.pieces.white)
        // let blackPlayer = 
        // let players =  { 
        //     white: new Player(this.pieces.white), 
        //     black: new Player(this.pieces.black)
        // }
        // new Game(whitePlayer,blackPlayer)
        this.game = new Game(this, gameId);
        this.board = new Board(this);
        
        // shadowGenerator.getShadowMap().renderList.push(this.board.board);
        // shadowGenerator.addShadowCaster(this.board.board);
        // shadowGenerator.useExponentialShadowMap = true;

        // this.scene.manager.createLightCamera(canvas)
        this.engine.runRenderLoop(()=>{
            this.scene.render();
        });
    }
    
    loadPieces(){

        this.assetsManager = new BABYLON.AssetsManager(this.scene)
        this.assetsManager.useDefaultLoadingScreen = false
        var meshTask = this.assetsManager.addContainerTask("pieces task", "", "./assets/", 'Chesspieces.babylon');
        meshTask.onError = (err) => console.log(err)
        meshTask.onSuccess = (task) => {
            this.piecesContainer = task.loadedContainer
            this.modelsLoaded = true;
            this.pieces = {
                white: this.piecesContainer.instantiateModelsToScene(name => name + "_white", false).rootNodes,
                black: this.piecesContainer.instantiateModelsToScene(name => name + "_black", false).rootNodes
            }
            let materials = this.getPieceMaterials()
            // var kingGlowLayer = new BABYLON.GlowLayer("glow", this.scene);
            // kingGlowLayer.intensity = .02;
            this.pieces.white.forEach(piece => {
                if (piece.name.startsWith('Knight')) piece.rotation = new BABYLON.Vector3(0, Math.PI, 0)
                if (piece.name.startsWith('King')){
                    piece.material = materials.white.clone()
                    // kingGlowLayer.addIncludedOnlyMesh(piece)
                    // piece.material.emissiveColor = new BABYLON.Color3(0.37, 0.29, 0.28)
                } else {
                    piece.material = materials.white
                }
                piece.addPickingBox()
            });
            this.pieces.black.forEach(piece => {
                
                let newPos = piece.position.clone()
                piece.position = new BABYLON.Vector3(newPos.x, newPos.y, -newPos.z)
                if (piece.name.startsWith('Knight')) piece.rotation = new BABYLON.Vector3(0, 0, 0)
                if (piece.name.startsWith('King')) {
                    piece.material = materials.black.clone()
                    // kingGlowLayer.addIncludedOnlyMesh(piece)
                    // piece.material.emissiveColor = piece.material.diffuseColor
                } else {
                    piece.material = materials.black
                    piece.material.metallicTexture = null
                }
                piece.addPickingBox()
            });
            
            this.board.mapPiecesToSquares(this.pieces)// reconsider this flow
            this.hideLoader()
            // todo: signal to server player is ready. Used for syncing start timing
        }

        this.assetsManager.load()
    }

    getPieceMaterials(){
        var white = new BABYLON.StandardMaterial(this.scene);
        white.alpha = 1;
        white.diffuseColor = new BABYLON.Color3(0.90, 0.82, 0.63); // white rgb(229,209,160)
        white.specularColor = new BABYLON.Color3(0.2, 0.2, 0.2);
        white.specularPower = 25;
        let black = white.clone();
        black.diffuseColor = new BABYLON.Color3(0.37, 0.29, 0.28); // black rgb(94,77,71)
        return { white, black}
    }

    openPromotionUI(){
        this.uiActions.showPromotionUI(); 
    }
    
    setupLoader(){
        let customLoader = {
            displayLoadingUI: _ => this.uiActions.showLoader(),
            hideLoadingUI: _ => this.uiActions.hideLoader() 
        }
        this.engine.loadingScreen = customLoader;
    }

    hideLoader(){
        this.engine.hideLoadingUI()
    }

}


// assetsManager.onFinish = function (tasks) {
//     engine.runRenderLoop(function () {
//         scene.render();
//     });
// };



export default Scene;
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
        this.board; 
        this.assetsManager;
    }

    setup(canvas, actions, path, file){
        if(!canvas) console.warn('no canvas found')
        this.uiActions = actions;
        let that = this;
        let engine = new BABYLON.Engine(canvas, true);
        let scene = SceneManager.CreateScene(engine, true)
        this.scene = scene

        this.loadPieces()
        // let shadowGenerator = this.scene.manager.setEnv(canvas)
        this.scene.manager.setEnv(canvas)

        // let player2 = new Player("./assets/", 'Chesspieces.babylon', scene)
        // let player2 = await player2()
        // new Game([player1,player2])
        this.game = new Game(scene, canvas);

        this.board = new Board(scene, canvas, this.game);
        
        // shadowGenerator.getShadowMap().renderList.push(this.board.board);
        // shadowGenerator.addShadowCaster(this.board.board);
        // shadowGenerator.useExponentialShadowMap = true;

        // this.scene.manager.createLightCamera(canvas)
        engine.runRenderLoop(function(){
            scene.render();
        });
    }
    
    loadPieces(){
        this.assetsManager = new BABYLON.AssetsManager(this.scene)
        var meshTask = this.assetsManager.addContainerTask("pieces task", "", "./assets/", 'Chesspieces.babylon');
        meshTask.onError = (err) => console.log(err)
        meshTask.onSuccess = (task) => {
            this.piecesContainer = task.loadedContainer
            // this.piecesContainer.addAllToScene()
            // this.piecesContainer.instantiateModelsToScene(name => name + "white", false);
            this.modelsLoaded = true;
            this.pieces = {
                white: this.piecesContainer.instantiateModelsToScene(name => name + "_white", false),
                black: this.piecesContainer.instantiateModelsToScene(name => name + "_black", false)
            }
            let materials = this.getPieceMaterials()

            this.pieces.white.rootNodes.forEach(piece => {
                if (piece.name.startsWith('Knight') ) piece.rotation = new BABYLON.Vector3(0, Math.PI, 0)
                piece.material = materials.white
            });
            this.pieces.black.rootNodes.forEach(piece => {
                let newPos = piece.position.clone()
                piece.position = new BABYLON.Vector3(newPos.x, newPos.y, -newPos.z)
                piece.material = materials.black
                piece.material.metallicTexture = null
                if (piece.name.startsWith('Knight') ) piece.rotation = new BABYLON.Vector3(0, 0, 0)
            });
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

    openChat(character){
        //character needs img url, and perhaps name to send to watson to pick convo workspace
        this.uiActions.showChat(character); //will cause all Chat.js component code to run
    }
    

}


// assetsManager.onFinish = function (tasks) {
//     engine.runRenderLoop(function () {
//         scene.render();
//     });
// };



export default Scene;
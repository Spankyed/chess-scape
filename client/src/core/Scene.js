import SceneManager from './utils/SceneManager';
// import utils from './utils/utils'; 
import Board from './Board';
import Player from './Player'; 

const Scene = new class {
    constructor(){
        this.scene = null;
        this.uiActions = {};    
    }

    setup(canvas, actions, path, file){
        if(!canvas) console.warn('no canvas found')
        this.uiActions = actions;
        let that = this;
        let engine = new BABYLON.Engine(canvas, true);
        let scene = SceneManager.CreateScene(engine, true)
        this.scene = scene

        let player2 = new Player("./assets/", 'Chesspieces.babylon', scene)
        // let player2 = await player2()

        new Board(scene, canvas);

        // new Game([player1,player2])

        this.scene.manager.setEnv(canvas)
        // this.scene.manager.createLightCamera(canvas)
        engine.runRenderLoop(function(){
            scene.render();
        });
    }
    
    openChat(character){
        //character needs img url, and perhaps name to send to watson to pick convo workspace
        this.uiActions.showChat(character); //will cause all Chat.js component code to run
    }
    

}

export default Scene;
import SceneManager from './utils/SceneManager';
// import utils from './utils/utils'; 
import Board from './Board';
import Game from './Game';
import Player from './Player'; 

const Scene = new class {
    constructor(){
        this.scene = null;
        this.uiActions = {};   
        this.game; 
        this.board; 
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

        this.game = new Game(scene, canvas);

        this.game.move('b4')
        this.game.move('b6')
        console.log('moves', this.game.moves())
        
        // new Game([player1,player2])
        this.board = new Board(scene, canvas, this.game);


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
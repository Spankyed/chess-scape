//externals
import SceneManager from './SceneManager';
// import InterfaceManager from './InterfaceManager';
import Board from './Board';

//internals
import Item from './Entities/Item';
import Player from './Entities/Player'; 
import { AnimationSystem } from './Systems/AnimationSystem';
import { NavigationSystem } from './Systems/NavigationSystem';
import { ActionSystem } from './Systems/MoveSystem'; //for user and npcs (low level)
import { EventSystem } from './Systems/EventSystem'; //mainly for npcs

const Scene = new class {
    constructor(){
        this.scene = null;
        this.ecs = null;   
        this.actions = {};    
    }

    setup(actions, path, file){
        this.actions = actions;
        let canvas = document.getElementById("renderCanvas"); // should check for canvas first
        let engine = new BABYLON.Engine(canvas, true);
        let that = this;

        let scene = SceneManager.CreateScene(engine)
        that.scene = scene

        that.ecs = scene.manager._ecs

        // let navMesh = loadedScene.getMeshByName("Navmesh"); 
        scene.manager._ecs.addEntity(new Player("./assets/", 'Chesspieces.babylon', scene)); // ../assets/player/

        new Board(scene, canvas);
        // showNavMesh(loadedScene, navMesh)

        for (var i = 0; i < scene.meshes.length; i++) {
            scene.meshes[i].convertToFlatShadedMesh();
        }
        
        engine.runRenderLoop(function(){
            scene.render();
        });

        scene.debugLayer.show({ embedMode: true }).then(() => {
            // scene.debugLayer.select(light);
        });

        window.addEventListener("resize", function () { 
            engine.resize();
        });
        
        function setEnv(scene, canvas){
            //var camera = new BABYLON.UniversalCamera("UniversalCamera", new BABYLON.Vector3(3, 2, 3), scene);
            var camera = new BABYLON.FreeCamera("FreeCamera", new BABYLON.Vector3(-1.5, 2, 6), scene);
            camera.setTarget( new BABYLON.Vector3(0, 1, 0));
            scene.activeCamera = camera
            camera.attachControl(canvas, true);
            camera.fov=1
            camera.keysUp = [87]; // w
            camera.keysDown = [83]; // S
            camera.keysLeft = [65]; // a
            camera.keysRight = [68]; // D
            camera.speed = 1;
            camera.inertia = 0.4;
            camera.angularSensibility = 500;
            camera.maxZ=1000
            camera.minZ=0

            camera.ellipsoid = new BABYLON.Vector3(1, 1, 1); //0.4, 1, 0.4
            //scene.gravity = new BABYLON.Vector3(0, -0.9, 0);
            scene.collisionsEnabled = true;
            camera.checkCollisions = true;
            //camera.applyGravity = true;
        
            var light = new BABYLON.HemisphericLight('light1', new BABYLON.Vector3(0,2,0), scene);
            light.intensity = 0.15;
            light.diffuse = new BABYLON.Color3(1, 1, 0.5);
            light.specular = new BABYLON.Color3(1, 1, 1);
            light.groundColor = new BABYLON.Color3(.5, 1, 1);
            var light2 = new BABYLON.HemisphericLight('light1', new BABYLON.Vector3(-1,10,-5), scene);
            light2.intensity = 0.35;
        }
        function showNavMesh(scene, navmesh){
            navmesh.material = new BABYLON.StandardMaterial("navMaterial", scene);
            navmesh.material.diffuseColor = new BABYLON.Color3(0, 1, 0);
            navmesh.material.alpha = 0.5;
            navmesh.material.wireframe = true;
        }
    }
    
    openChat(character){
        //character needs img url, and perhaps name to send to watson to pick convo workspace
        this.actions.showChat(character); //will cause all Chat.js component code to run
    }
    
    triggerEvent(event){
        let eventSystem = this.ecs.getSystem('Event');
        eventSystem.playback(event);
    }
}


export default Scene;
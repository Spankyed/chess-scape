import Entity from './Entity';
import  SceneManager  from '../SceneManager';
// import  { ActionComponent }  from '../Components/ActionComponent';
// import  { NavigationComponent }  from '../Components/NavigationComponent';
import  { AnimationComponent }  from '../Components/AnimationComponent';
// import  { EventComponent }  from '../Components/EventComponent';

//Refactor to Character
export default class Player extends Entity.with( AnimationComponent ) {
    
    constructor(path, fileName, scene) {
        super();
        this.id = 'player';
        this.scene;
        this.importMesh(path, fileName, scene); //sets this.mesh
        // this.anims = this.setAnimations();
        // this.actions = this.setActions();
    }

    importMesh(path, fileName, scene) {
        let callback = (meshes, particleSystems, skeletons)=>{
            let player = meshes[0];
            console.log('pieces',meshes)
            player.position = new BABYLON.Vector3(0, .68 +.32, 0);

            var material = new BABYLON.StandardMaterial(scene);
            material.alpha = 1;
            material.diffuseColor = new BABYLON.Color3(0.90, 0.82, 0.63); //white
            // material.diffuseColor = new BABYLON.Color3(0.37, 0.29, 0.28); //black
            player.material = material;


            // player.material.diffuseColor = new BABYLON.Color3(0.8, 0.8, 0.8);
            player.material.specularColor = new BABYLON.Color3(0.5, 0.5, 0.5);
            player.material.specularPower = 32;

            this.mesh = player; //set entity.mesh
            // this.skeleton = skeleton; //set entity.skeleton
        }
        SceneManager.ImportMesh("", path, fileName, scene, callback.bind(this))
    }

    setAnimations(){
        let anims = {
            isWalking: "YBot_Walk",
            idle: "YBot_Idle"
        }
        return anims;
        //return animation ranges instead?
    }

    setActions(){
        // aka events
        let actions = {
            public: {
                talk: {
                    text: 'Talk with',
                    handler: ()=>{
                        //will be overwritten in ActionSystem.getActions()
                    }
                } 
            },
            private: {
                move: {
                    text: 'Move to',
                    handler: (destination)=>{
                        //Navigation
                        //console.log(destination)
                        this.destination = destination;
                        //console.log(this.state, this.destination)
                        this.path = null;
                        this.moving = destination ? true : false ;
                        //Animation
                        this.transition = true;                  
                        this.state = 'isWalking';         
                    }
    
                },
                stop: {
                    text: 'Stop',
                    handler: (entity)=>{
                        //Navigation
                        this.moving = false 
                        //Animation
                        this.transition = true;
                        this.state = 'idle';
                    }
                }
            }
        }
        
        //this.on('move', (destination)=>{ this.actions.move.handler(destination) })
        //this.on('stop', (args)=>{ this.actions.stop.handler(args) })
        for(let action in actions.private){
            this.on(action, (arg)=>{ actions.private[action].handler(arg) })
        }

        return actions;
    }

}


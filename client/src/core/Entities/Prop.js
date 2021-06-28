import Entity from './Entity';
import  SceneManager  from '../SceneManager';
import  { ActionComponent }  from '../Components/ActionComponent';
import  { NavigationComponent }  from '../Components/NavigationComponent';

export default class Prop extends Entity.with(ActionComponent, NavigationComponent) {
    
    constructor(id, scene) {
        super();
        this.scene = scene;
        this.mesh = this.createMesh(scene); 
        this.id = id; //change id to type?
        this.actions = this.setActions()
        this.on('gift', (destination)=>{ 
            this.actions.gift()
            this.interacting = true ;
        })
        this.on('stop', (args)=>{ 
            this.interacting = false 
        })
    }

    createMesh (scene) {        
        var boxMat = new BABYLON.StandardMaterial("texture1", scene);
        boxMat.diffuseColor = new BABYLON.Color3(0, 1, 0);//Green
        var box = BABYLON.Mesh.CreateBox("Box", 1, scene);
        box.material = boxMat;
        box.position = new BABYLON.Vector3(4, .7, 5);
        return box
    }

    setActions(){
        let actions = {
            gift: ()=>{
                //if (entity.mesh) this.player.trigger('move', entity.mesh.position.clone())
                let animationBox = new BABYLON.Animation("gift", "scaling.x", 30, BABYLON.Animation.ANIMATIONTYPE_FLOAT,
                BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
                let keys = [];

                keys.push({
                    frame: 0,
                    value: 1
                });
                keys.push({
                    frame: 20,
                    value: 0.2
                });
                keys.push({
                    frame: 100,
                    value: 1
                });
                animationBox.setKeys(keys);
                this.mesh.animations.push(animationBox);
                this.scene.beginAnimation(this.mesh, 0, 100, true);
                setInterval(()=>{
                    this.mesh.material.diffuseColor = new BABYLON.Color3(Math.random(), Math.random(), Math.random());
                }, 1000);
            }
        }
        return actions
    }
    
}
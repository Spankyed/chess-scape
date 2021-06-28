import Entity from './Entity';
import  SceneManager  from '../SceneManager';
import  { ActionComponent }  from '../Components/ActionComponent';
import  { NavigationComponent }  from '../Components/NavigationComponent';
import  { EventComponent }  from '../Components/EventComponent';

export default class Item extends Entity.with(ActionComponent, NavigationComponent, EventComponent) {
    
    constructor(id, scene) {
        super();
        this.scene = scene;
        this.mesh = this.createMesh(scene); 
        this.id = id; //change id to type?
        this.actions = this.setActions()
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
        let frameRate = 5;
        let xScale = new BABYLON.Animation("xScale", "scaling.x", 10, BABYLON.Animation.ANIMATIONTYPE_FLOAT,
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
        xScale.setKeys(keys);
        let xSlide = new BABYLON.Animation("xSlide", "position.x", frameRate, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
        var keyFramesP = []; 
        keyFramesP.push({
            frame: 0,
            value: 2
        });
        keyFramesP.push({
            frame: frameRate,
            value: -2
        });
        keyFramesP.push({
            frame: 2 * frameRate,
            value: 2
        });
        xSlide.setKeys(keyFramesP);
        //Rotation Animation
        var yRot = new BABYLON.Animation("yRot", "rotation.y", frameRate, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE); 
        var keyFramesR = []; 
        keyFramesR.push({
            frame: 0,
            value: 0
        });
        keyFramesR.push({
            frame: frameRate,
            value: 4 * Math.PI
        });
        keyFramesR.push({
            frame: 3 * frameRate,
            value: 8 * Math.PI
        });
        yRot.setKeys(keyFramesR);

        //Hard Coded Animations

        let actions = {
            public: {
                suprise: {
                    text: 'Suprise',
                    handler: ()=>{                   
                        //this.mesh.animations.push(animationBox);
                        //this.scene.beginAnimation(this.mesh, 0, 100, true);
                        this.scene.beginDirectAnimation(this.mesh, [xScale, xSlide, yRot], 0, 2 * frameRate, true);
        
                        let intervalId = setInterval(()=>{
                            this.mesh.material.diffuseColor = new BABYLON.Color3(Math.random(), Math.random(), Math.random());
                        }, 250);
        
                        setTimeout(()=>{
                            clearInterval(intervalId)
                            this.scene.stopAnimation(this.mesh)
                        }, 2000)      
                    }
    
                },
            },
            private: {}

        }
        
        
        this.on('suprise', (destination)=>{ 
            actions.public.suprise.handler()
            //this.interacting = true ;
        })

        /*
        this.on('stop', (args)=>{ 
            //this.interacting = false 
        })*/
        return actions
    }
    
}
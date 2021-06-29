import  SceneManager  from './utils/SceneManager';

//Refactor to Character
export default class player {
    
    constructor(path, fileName, scene) {
        this.id = 'player';
        this.scene = scene;
        this.importMesh(path, fileName, scene); //sets this.mesh

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


}


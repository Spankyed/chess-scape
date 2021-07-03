import utils from './utils'; 

const { FreeCameraKeyboardRotateInput } = utils

export default class SceneManager {
    /**
     * Create a new scene and registers a manager instance
     * @param engine 
     */
    static CreateScene(engine) {
        let scene;
        if(!SceneManager._scene){
            scene = new BABYLON.Scene(engine);
            scene.manager = new SceneManager(scene)
            for (var i = 0; i < scene.meshes.length; i++) {
                scene.meshes[i].convertToFlatShadedMesh();
            }
            scene.debugLayer.show({ embedMode: true }).then(() => {
                // scene.debugLayer.select(light);
            });
            window.addEventListener("resize", function () { 
                engine.resize();
            });
        }

        return scene;
    }
    /**
     * Append and parse scene objects from a filename url
     */
    static AppendScene(rootUrl, fileName, scene, onSuccess,  onProgress, onError) {
        let scenex = scene;
        let onSuccessWrapper = (sn) => {
            //SceneManager.readyHandlers.forEach((handler) => { handler(this._scene, this); }); //apply 'this' context to handlers?
            if (onSuccess != null) onSuccess(sn);
        };
        return BABYLON.SceneLoader.Append(rootUrl, fileName, scene, onSuccessWrapper, onProgress, onError);
    }
    /**
     * Load and parse a new scene and register a manager instance
     */
    static LoadScene(rootUrl, fileName, engine, onSuccess, onProgress) {
        let onError = (arg1, arg2, Exception) => {
            console.error(Exception) // show exception to debug LoadScene callback
        }
        return SceneManager.AppendScene(rootUrl, fileName, SceneManager.CreateScene(engine), onSuccess, onProgress, onError); //here be magic
    }
    /** 
     * Import and parse mesh from a filename url 
     * */        
    static ImportMesh(meshNames, rootUrl, sceneFilename, scene, onSuccess) {
        let scenex = scene;
        let onSuccessWrapper = (meshes, particleSystems, skeletons)=> {
            if (onSuccess != null) onSuccess(meshes, particleSystems, skeletons);
        };
        return BABYLON.SceneLoader.ImportMesh(meshNames, rootUrl, sceneFilename, scene, onSuccessWrapper);
    }

    get scene() { return this._scene; }
    get time() { return this._time; }
    constructor(scene) {
        if (scene == null) throw new Error("Host scene not specified.");
        this._scene = scene;
        this._time = 0;
        // Register scene render loop handlers
        this._scene.registerBeforeRender(this._beforeRender);
        this._scene.registerAfterRender(this._afterRender);
    }
    _beforeRender(scene){
        // this._time++
        // scene.manager._ecs.update()
    }
    _afterRender(){        
    }

    
    setEnv(canvas){
        console.log('the scene',this._scene)
        //var camera = new BABYLON.UniversalCamera("UniversalCamera", new BABYLON.Vector3(3, 2, 3), scene);
        // var camera = new BABYLON.FreeCamera("FreeCamera", new BABYLON.Vector3(-1.5, 2, 6), this._scene);
        // camera.setTarget( new BABYLON.Vector3(-1.580, 7, 9.649));
        // camera.rotation = 
        // camera.attachControl(canvas, true);
        //this._scene.gravity = new BABYLON.Vector3(0, -0.9, 0);
        //camera.applyGravity = true;
    

        var camera = new BABYLON.ArcRotateCamera("Camera", -Math.PI/2, .6, 25, new BABYLON.Vector3(0, 0, 0), this._scene);
        camera.attachControl(canvas, true);
        camera.inputs.attached.pointers.detachControl();
        // camera.inputs.attached.keyboard.detachControl();
        camera.inputs.attached.mousewheel.detachControl();
        // console.log('inputs',camera.inputs)
        // camera.inputs.add(new FreeCameraKeyboardRotateInput());
        camera.lowerBetaLimit = 0.1;
        camera.upperBetaLimit = (Math.PI / 2) * 0.99;
        camera.inertia = 0.4;
        camera.fov=.7

        // camera.keysUp = [87]; // w
        // camera.keysDown = [83]; // S
        // camera.keysLeft = [37]; // a
        // camera.keysRight = [39]; // D
        // camera.speed = 1;
        // camera.angularSensibility = 500;
        // camera.maxZ=1000
        // camera.minZ=0
        // camera.ellipsoid = new BABYLON.Vector3(1, 1, 1); //0.4, 1, 0.4
        // this._scene.collisionsEnabled = true;
        // camera.checkCollisions = true;

        this._scene.activeCamera = camera


        let spotLight = new BABYLON.SpotLight("SpotLight", new BABYLON.Vector3(0, 30, 0), new BABYLON.Vector3(0, -1, 0), 0.8, 20, this._scene);
        spotLight.intensity = 0.5;
        spotLight.exponent = 5;
        spotLight.diffuse = new BABYLON.Color3(0.8, 0.95, 1.000);
        
        var light = new BABYLON.HemisphericLight('light1', new BABYLON.Vector3(0,2,0), this._scene);
        light.intensity = 0.15;
        light.diffuse = new BABYLON.Color3(1, 1, 0.5);
        light.specular = new BABYLON.Color3(1, 1, 1);
        light.groundColor = new BABYLON.Color3(.5, 1, 1);
        var light2 = new BABYLON.HemisphericLight('light1', new BABYLON.Vector3(-1,10,-5), this._scene);
        light2.intensity = 0.35;
    }

    createLightCamera(canvas){
        // var camera = new BABYLON.ArcRotateCamera("Camera", -Math.PI/2, 1.1, 25, new BABYLON.Vector3(0, 0, 0), this._scene);
        // camera.attachControl(canvas, true);
        // camera.lowerBetaLimit = 0.1;
        // camera.upperBetaLimit = (Math.PI / 2) * 0.99;
        // this._scene.clearColor = new BABYLON.Color3(0, 0, .2);
        // this._scene.ambientColor = new BABYLON.Color3(0.8, 0.8, 0.8);

        const light1 = new BABYLON.HemisphericLight("HemiLight", new BABYLON.Vector3(0.2, 1, 0), this._scene);
        light1.groundColor = new BABYLON.Color3(0, 0, 0);
        light1.diffuse = new BABYLON.Color3(0.9, 0.9, 0.9);
        light1.specular = new BABYLON.Color3(0, 0, 0);

        const light2 = new BABYLON.DirectionalLight("DirectionalLight", new BABYLON.Vector3(0.3, -1, 0.3), this._scene);
        light2.position = new BABYLON.Vector3(0, 60, 0);
        light2.diffuse = new BABYLON.Color3(1, 1, 1);
        light2.specular = new BABYLON.Color3(0, 0, 0);
        light2.intensity = 0.2;


        // var sg = new BABYLON.ShadowGenerator(1024, light1);

        // sg.getShadowMap().renderList.push(sphere);
    
        // light1.shadowMinZ = 0;
        // light1.shadowMaxZ = 3;
        var material = new BABYLON.StandardMaterial();
        material.alpha = 1;
        material.diffuseColor = new BABYLON.Color3(0, 0, 0); 

        var ground = BABYLON.MeshBuilder.CreateGround("ground", {width: 50, height: 50}, this.scene);
        ground.position = new BABYLON.Vector3(0, -.01, 0);
        
        ground.material = material;

        ground.receiveShadows = true;
        return light1
    }

        /** TODO: Switch between players/characters */
    // getMainCamera(player = PlayerNumber.One) { //below is psuedo code
    //     let result = null;
    //     switch (player) {
    //         case PlayerNumber.One:
    //             result = this._playerOneCamera;
    //             break;
    //         case PlayerNumber.Two:
    //             result = this._playerTwoCamera;
    //             break;
    //         case PlayerNumber.Three:
    //             result = this._playerThreeCamera;
    //             break;
    //         case PlayerNumber.Four:
    //             result = this._playerFourCamera;
    //             break;
    //     }
    //     return result;
    // }
}

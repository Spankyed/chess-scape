import utils from './utils'; 

const { FreeCameraKeyboardRotateInput } = utils

export default class SceneManager {
    /**
     * Create a new scene and registers a manager instance
     * @param engine 
     */
    static CreateScene(engine, canvas) {
        let scene;
        if(!SceneManager._scene){
            scene = new BABYLON.Scene(engine);
            scene.manager = new SceneManager(scene)
            // for (var i = 0; i < scene.meshes.length; i++) {
            //     scene.meshes[i].convertToFlatShadedMesh();
            // }
            // scene.debugLayer.show({ embedMode: true }).then(() => {
            //     // scene.debugLayer.select(light);
            // });

            // window.addEventListener("resize", _ =>  );
            const resize$ = new ResizeObserver( _ => engine.resize() ); // todo: make sure this gets disposed
            resize$.observe(canvas)
            // const resize$ = utils.fromResize(canvas)
            // resize$.subscribe(_ => engine.resize(false)) // add this observable & others to a cleanup method, and call on dispose
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
        // console.log('the scene',this._scene)
        //var camera = new BABYLON.UniversalCamera("UniversalCamera", new BABYLON.Vector3(3, 2, 3), scene);
        // var camera = new BABYLON.FreeCamera("FreeCamera", new BABYLON.Vector3(-1.5, 2, 6), this._scene);
        // camera.setTarget( new BABYLON.Vector3(-1.580, 7, 9.649));
        // camera.rotation = 
        // camera.attachControl(canvas, true);
        //this._scene.gravity = new BABYLON.Vector3(0, -0.9, 0);
        //camera.applyGravity = true;

        this._scene.clearColor = new BABYLON.Color3(0.19, 0.18, 0.17);

        const narrowDevice = (window.innerWidth/window.innerHeight) < 1.1
        let cameraDistance = narrowDevice ? 33 : 25
        var camera = new BABYLON.ArcRotateCamera("Camera", -Math.PI/2, .6, cameraDistance, new BABYLON.Vector3(0, 0, 0), this._scene);
        camera.attachControl(canvas, true);
        camera.inputs.attached.pointers.detachControl();
        // camera.inputs.attached.keyboard.detachControl();
        camera.inputs.attached.mousewheel.detachControl();
        // console.log('inputs',camera.inputs)
        // camera.inputs.add(new FreeCameraKeyboardRotateInput());
        camera.lowerBetaLimit = 0.4;
        camera.upperBetaLimit = (Math.PI / 2) * .80;
        camera.inertia = 0.65;
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

        let spotLight = new BABYLON.SpotLight("SpotLight", new BABYLON.Vector3(0, 50, 0), new BABYLON.Vector3(0, -1, 0), 0.8, 40, this._scene);
        // let spotLight = new BABYLON.SpotLight("SpotLight", new BABYLON.Vector3(0, 100, 0), new BABYLON.Vector3(0, -1, 0), 0.8, 0, this._scene);
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

        // return new BABYLON.ShadowGenerator(1024, spotLight);
    }

    createLightCamera(canvas){
        this._scene.createDefaultCameraOrLight(true, true, true);
		this._scene.activeCamera.lowerRadiusLimit = 7;
		this._scene.activeCamera.upperRadiusLimit = 5;
		this._scene.activeCamera.alpha = 4;
        this._scene.activeCamera.beta = 2.5;
        this._scene.activeCamera.wheelPrecision = 5;
		this._scene.activeCamera.upperBetaLimit=1.5; //Math.PI*(0)/180;
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

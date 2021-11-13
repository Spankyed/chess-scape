import { FromResize } from './utils'; 
import { updateNavigation } from '../board/navigationSystem'; 
import { Scene } from "@babylonjs/core/scene";
import { Vector3 } from "@babylonjs/core/Maths/math";
import { Color4, Color3 } from "@babylonjs/core/Maths/math";
import { CubicEase } from "@babylonjs/core/Animations/easing";
import { Animation } from "@babylonjs/core/Animations/animation";
import { EasingFunction } from "@babylonjs/core/Animations/easing";
// import { SpotLight } from "@babylonjs/core/Lights/spotLight";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
// import { FreeCamera } from "@babylonjs/core/Cameras/freeCamera";
import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
// import { ShadowGenerator } from "@babylonjs/core/Lights/Shadows/shadowGenerator";

export default class SceneManager {
    /**
     * Create a new scene and register a manager instance
     * @param engine 
     */
    static CreateScene(engine, canvas) {
        let scene;
        if(!SceneManager._scene){
            scene = new Scene(engine);
            scene.manager = new SceneManager(scene)
            // for (var i = 0; i < scene.meshes.length; i++) {
            //     scene.meshes[i].convertToFlatShadedMesh();
            // }
            // scene.debugLayer.show({ embedMode: true }).then(() => {
            //     // scene.debugLayer.select(light);
            // });
            const resize$ = FromResize(canvas)
            resize$.subscribe(_ => engine.resize(false)) // add this observable & others to a cleanup method, and call on dispose
        }
        return scene;
    }
    get scene() { return this._scene; }
    // get time() { return this._time; }
    constructor(scene) {
        if (scene == null) throw new Error("Host scene not specified.");
        this._scene = scene;
        // this._time = 0;
        // Register scene render loop handlers
        this._scene.registerBeforeRender(this._beforeRender);
        this._scene.registerAfterRender(this._afterRender);
    }
    _beforeRender(scene){ }
    _afterRender(){        
        updateNavigation()
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

		// change background color to dark-gray
		// this._scene.clearColor = new BABYLON.Color3(0.19, 0.18, 0.17);
		this._scene.clearColor = new Color4(0, 0, 0, 0);
		const narrowDevice = window.innerWidth / window.innerHeight < 1.1;
		let cameraDistance = narrowDevice ? 33 : 25;
		var camera = new ArcRotateCamera(
			"Camera",
			0,
			2,
			cameraDistance,
			new Vector3(0, 0, 0),
			this._scene
		);
		camera.attachControl(canvas, true);
		camera.inputs.attached.pointers.detachControl();
		// camera.inputs.attached.keyboard.detachControl();
		camera.inputs.attached.mousewheel.detachControl();
		// console.log('inputs',camera.inputs)
		// camera.inputs.add(new FreeCameraKeyboardRotateInput());
		camera.lowerBetaLimit = 0.25;
		camera.upperBetaLimit = (Math.PI / 2) * 0.65;
		camera.inertia = 0.65;
		camera.fov = 0.7;

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

		this._scene.activeCamera = camera;

		// let spotLight = new SpotLight("SpotLight", new Vector3(0, 50, 0), new Vector3(0, -1, 0), 0.8, 40, this._scene);
		// spotLight.intensity = 0.5;
		// spotLight.exponent = 5;
		// spotLight.diffuse = new Color3(0.8, 0.95, 1.000);

		var light = new HemisphericLight(
			"light1",
			new Vector3(0, 2, 0),
			this._scene
		);
		light.intensity = 0.15;
		light.diffuse = new Color3(1, 1, 0.5);
		light.specular = new Color3(1, 1, 1);
		light.groundColor = new Color3(0.5, 1, 1);
		var light2 = new HemisphericLight(
			"light1",
			new Vector3(-1, 10, -5),
			this._scene
		);
		light2.intensity = 0.15;
		// return new BABYLON.ShadowGenerator(1024, spotLight);
	}

    // not used
    createLightCamera(canvas){
        this._scene.createDefaultCameraOrLight(true, true, true);
		this._scene.activeCamera.lowerRadiusLimit = 7;
		this._scene.activeCamera.upperRadiusLimit = 5;
		this._scene.activeCamera.alpha = 4;
        this._scene.activeCamera.beta = 2.5;
        this._scene.activeCamera.wheelPrecision = 5;
		this._scene.activeCamera.upperBetaLimit=1.5; //Math.PI*(0)/180;
    }

    animateCameraIntoPosition(color) {
        const ease = new CubicEase();
		ease.setEasingMode(EasingFunction.EASINGMODE_EASEOUT);
        const alphas = { white: -Math.PI / 2, black: Math.PI / 2 };
        const camera = this._scene.activeCamera;
		Animation.CreateAndStartAnimation(
			"rotate",
			camera,
			"alpha",
			20,
			40,
			camera.alpha,
			alphas[color],
			0,
			ease
		);
		Animation.CreateAndStartAnimation(
			"tilt",
			camera,
			"beta",
			20,
			40,
			camera.beta,
			0.6,
			0,
            ease
		);
    }
}

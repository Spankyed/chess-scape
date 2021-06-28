import ECS from './Ecs';

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
    get ecs() { return this._ecs; }
    constructor(scene) {
        if (scene == null) throw new Error("Host scene not specified.");
        this._scene = scene;
        this._time = 0;
        this._ecs = new ECS;
        // Register scene render loop handlers
        this._scene.registerBeforeRender(this._beforeRender);
        this._scene.registerAfterRender(this._afterRender);
    }
    _beforeRender(scene){
        this._time++
        scene.manager._ecs.update()
    }
    _afterRender(){        
    }

    /** TODO: Switch between players/characters */
    getMainCamera(player = PlayerNumber.One) { //below is psuedo code
        let result = null;
        switch (player) {
            case PlayerNumber.One:
                result = this._playerOneCamera;
                break;
            case PlayerNumber.Two:
                result = this._playerTwoCamera;
                break;
            case PlayerNumber.Three:
                result = this._playerThreeCamera;
                break;
            case PlayerNumber.Four:
                result = this._playerFourCamera;
                break;
        }
        return result;
    }
}

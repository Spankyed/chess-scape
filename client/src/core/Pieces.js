// import  SceneManager  from './utils/SceneManager';

function getPieceMaterials(scene){
    var white = new BABYLON.StandardMaterial(scene);
    white.alpha = 1;
    white.diffuseColor = new BABYLON.Color3(0.90, 0.82, 0.63); // white rgb(229,209,160)
    white.specularColor = new BABYLON.Color3(0.2, 0.2, 0.2);
    white.specularPower = 25;
    let black = white.clone();
    black.diffuseColor = new BABYLON.Color3(0.37, 0.29, 0.28); // black rgb(94,77,71)
    return { white, black}
}

function getPiecesContainer(scene){
    let assetsManager = new BABYLON.AssetsManager(scene)
    assetsManager.useDefaultLoadingScreen = false
    let meshTask = assetsManager.addContainerTask("pieces task", "", "./assets/", 'Chesspieces.babylon');
    return new  Promise((resolve, rej)=>{
        meshTask.onError = (err) => rej(err)
        meshTask.onSuccess = (task) => {
            resolve(task.loadedContainer)
        }
        assetsManager.load()
    })
}

async function loadPieces(scene){
    let container = await getPiecesContainer(scene)
    let pieces = {
        white: container.instantiateModelsToScene(name => name + "_white", false).rootNodes,
        black: container.instantiateModelsToScene(name => name + "_black", false).rootNodes
    }
    let materials = getPieceMaterials(scene)
    // var kingGlowLayer = new BABYLON.GlowLayer("glow", this.scene);
    // kingGlowLayer.intensity = .02;
    pieces.white.forEach(piece => {
        if (piece.name.startsWith('Knight')) piece.rotation = new BABYLON.Vector3(0, Math.PI, 0)
        if (piece.name.startsWith('King')){
            piece.material = materials.white.clone()
            // kingGlowLayer.addIncludedOnlyMesh(piece)
            // piece.material.emissiveColor = new BABYLON.Color3(0.37, 0.29, 0.28)
        } else {
            piece.material = materials.white
        }
        piece.isPickable = false
        // piece.addPickingBox()
    });
    pieces.black.forEach(piece => {
        
        let newPos = piece.position.clone()
        piece.position = new BABYLON.Vector3(newPos.x, newPos.y, -newPos.z)
        if (piece.name.startsWith('Knight')) piece.rotation = new BABYLON.Vector3(0, 0, 0)
        if (piece.name.startsWith('King')) {
            piece.material = materials.black.clone()
            // kingGlowLayer.addIncludedOnlyMesh(piece)
            // piece.material.emissiveColor = piece.material.diffuseColor
        } else {
            piece.material = materials.black
            piece.material.metallicTexture = null
        }
        piece.isPickable = false
        // piece.addPickingBox()
    });
    
    // this.board.mapPiecesToSquares(this.pieces)// reconsider this flow
    // todo: signal to server player is ready. Used for syncing start timing
    return pieces
}



export default loadPieces
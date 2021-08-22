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

function rotateKnight(piece, right){
    piece.rotation = new BABYLON.Vector3(0, right ? Math.PI : 0, 0)
}

async function loadPieces(scene){
    let container = await getPiecesContainer(scene)
    let pieces = [
        ...container.instantiateModelsToScene(name => name + "_white", false).rootNodes,
        ...container.instantiateModelsToScene(name => name + "_black", false).rootNodes
    ]

    let materials = getPieceMaterials(scene)
    // var kingGlowLayer = new BABYLON.GlowLayer("glow", this.scene);
    // kingGlowLayer.intensity = .02;

    let pieceMap = {}
    pieces.forEach( piece => {
        let isWhite = piece.name.endsWith('_white') ? true : false
        // if (piece.name.startsWith('King')){
        //     piece.material = isWhite ? materials.white.clone() : materials.black.clone()
        //     piece.material.metallicTexture = null
        // } else
        piece.material = isWhite ? materials.white : materials.black
        if (!isWhite){
            let newPos = piece.position.clone()
            piece.position = new BABYLON.Vector3(newPos.x, newPos.y, -newPos.z) // invert z
        }
        if (piece.name.startsWith('Knight')) rotateKnight(piece, isWhite)
        piece.isPickable = false
        piece.id = piece.name.charAt(0).toLowerCase() + '_' +  (isWhite ? 'w':'b')
        pieceMap[piece.id] = piece.id
        // piece.addPickingBox()
    })


    return [pieces, pieceMap]
}

export default loadPieces
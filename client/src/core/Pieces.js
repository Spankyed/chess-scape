import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { AssetsManager } from "@babylonjs/core";
import { Vector3, Color3 } from "@babylonjs/core/Maths/math";

function getPieceMaterials(scene){
    var white = new StandardMaterial(scene);
    white.alpha = 1;
    white.diffuseColor = new Color3(0.90, 0.82, 0.63); // white rgb(229,209,160)
    white.specularColor = new Color3(0.2, 0.2, 0.2);
    white.specularPower = 25;
    let black = white.clone();
    black.diffuseColor = new Color3(0.37, 0.29, 0.28); // black rgb(94,77,71)
    return { white, black }
}
function getPiecesContainer(scene){
    // todo: move this code to SceneManager
    let assetsManager = new AssetsManager(scene)
    assetsManager.useDefaultLoadingScreen = false
    let meshTask = assetsManager.addContainerTask("pieces task", "", "./assets/models/", 'pieces.babylon');
    return new Promise((resolve, rej) => {
        meshTask.onError = (err) => rej(err)
        meshTask.onSuccess = (task) => {
            resolve(task.loadedContainer)
        }
        assetsManager.load()
    })
}
function rotateKnight(piece, right){ piece.rotation = new Vector3(0, right ? Math.PI : 0, 0) }

async function loadPieces(scene){
    let container = await getPiecesContainer(scene)
    let pieces = [
        ...container.instantiateModelsToScene(name => name + "_white", false).rootNodes,
        ...container.instantiateModelsToScene(name => name + "_black", false).rootNodes
    ]
    let materials = getPieceMaterials(scene)
    // var kingGlowLayer = new GlowLayer("glow", this.scene);
    // kingGlowLayer.intensity = .02;

    let pieceCount = { 
        white: {'p':0,'r':0,'n':0,'b':0,'q':0,'k':0},
        black: {'p':0,'r':0,'n':0,'b':0,'q':0,'k':0}
    }
    let pieceMap = pieces.reduce( (map, piece) => {
        piece.isPickable = false
        let isWhite = piece.name.endsWith('_white') ? true : false
        // if (piece.name.startsWith('King')){
        //     piece.material = isWhite ? materials.white.clone() : materials.black.clone()
        //     piece.material.metallicTexture = null
        // } else
        piece.material = isWhite ? materials.white : materials.black
        if (!isWhite){
            let newPos = piece.position.clone()
            piece.position = new Vector3(newPos.x, newPos.y, -newPos.z) // flip position
        }
        if (piece.name.startsWith('Knight')) {
            rotateKnight(piece, isWhite)
            piece.id = 'n' + '_' +  (isWhite ? 'w':'b')
        } else {
            piece.id = piece.name.charAt(0).toLowerCase() + '_' +  (isWhite ? 'w':'b')
        }
        let count = ++pieceCount[isWhite ? 'white' : 'black'][piece.id.charAt(0)]
        piece.id += '_' + count
        // if (count >= 1) piece.id += '_' + count
        // piece.doNotSyncBoundingInfo = true;
        // piece.addPickingBox()
        return {...map, [piece.id]: piece}
    },{})

    // console.log('Piece Map ('+ Object.keys(pieceMap).length +') ', {pieceMap})
    // console.log('count', {pieceCount})

    return [pieces, pieceMap]
}

export default loadPieces
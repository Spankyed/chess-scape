let movingPieces = []
const stepLength = 0.7

function startMovingPiece(piece, destination) {
    movingPieces.push({ piece, destination });
}
function updateNavigation() {
    if (movingPieces.length > 0){
        movingPieces.forEach((move, idx) => {
            let isMoved = stepPiece(move)
            if (isMoved) movingPieces.splice(idx, 1);
        })
    }
}
function stepPiece(move) {
    // move piece to clicked sq coordinates over time 
    let { piece, destination } = move
    var moveVector = destination.subtract(piece.position);//parent position is being changed, not entity
    
    if (moveVector.length() > stepLength + .05) {
        moveVector = moveVector.normalize(); //get unit vector
        moveVector = moveVector.scale(stepLength); //speed scaler
        piece.moveWithCollisions(moveVector); //move entity
        return false
    } else {
        if (piece && !piece.position.equals(destination)){
            let updatedPos = new BABYLON.Vector3(destination.x, piece.position.y, destination.z)
            piece.position = updatedPos
        }
        return true
    }
}

export {
    startMovingPiece,
    updateNavigation
}
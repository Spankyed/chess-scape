export default class Board {
    constructor(scene, canvas, game){
        // Board class depends on game class have being instantiated
        this.scene = scene;  
        this.canvas = canvas;  
        this.game = game;
        this.squares = {}
        this.startingPos; 
        this.startingSq 
        this.currentPiece;  
        // this.dragPos;
        this.isSelecting = false;
        this.selectedHighlightLayer = new BABYLON.HighlightLayer("selected_piece", this.scene);
        this.setupEventListeners(scene,canvas)
        this.board = this.createBoard()
        return 
    }
    
    setupEventListeners(scene, canvas) {
        const listeners =  {   
            onPointerDown: (evt) => this.onPointerDown(evt),
            onPointerUp: (evt) => this.onPointerUp(evt),
            onPointerMove: (evt) => this.onPointerMove(evt),
            onRightPointerDown: (evt) => { if (evt.button == 2) this.resetMove(true) }
        }
        // todo: use rxjs fromEvent here
        canvas.addEventListener("pointerdown", listeners.onPointerDown, false);
        canvas.addEventListener("pointerup", listeners.onPointerUp, false);
        canvas.addEventListener("pointermove", listeners.onPointerMove, false);
        canvas.addEventListener("contextmenu", listeners.onRightPointerDown, false);
        scene.onDispose = function () {
            canvas.removeEventListener("pointerdown", listeners.onPointerDown);
            canvas.removeEventListener("pointerup", listeners.onPointerUp);
            canvas.removeEventListener("pointermove", listeners.onPointerMove);
            canvas.removeEventListener("contextmenu", listeners.onRightPointerDown);
        }
        return scene;
    };

    move(){
        // {"H7":"H5"}
        this.game.move()
    }

    // remove scene and ground
    onPointerDown(evt) {
        if (evt.button !== 0) return;
        var pickInfo = this.pickWhere((mesh) => mesh.isPickable);
        if (!pickInfo.hit)  return;
        if (this.currentPiece == pickInfo.pickedMesh){
            this.resetMove()
            return
        }
        // todo: check if pickedMesh is enemy piece, then ignore event (let pointerUp handle the possible eat move)
        this.currentPiece = pickInfo.pickedMesh;
        if (!this.currentPiece) return;
        // console.log('picked piece', this.currentPiece)
        if (this.currentPiece.id == 'board' || !this.currentPiece.isPickable) { // ignore picking on board
            this.currentPiece = null
            return
        };
        // set chesspiece startingPos and highlight the square underneath the piece yellow
        this.startingPos = this.currentPiece.position.clone();
        // console.log('starting point?',{picked:this.startingPos,mesh:this.currentPiece.position})
        this.startingSq = this.getClosestSq(this.startingPos);
        this.selectedHighlightLayer.removeAllMeshes();
        this.selectedHighlightLayer.addMesh(this.startingSq.mesh, BABYLON.Color3.Yellow());
        this.isSelecting = true;
        this.isDragging = true
        // console.log('mesh',this.currentPiece)
    }

    onPointerUp(evt) {
        if (evt.button == 2) return;
        if (!( this.isSelecting && this.startingPos )) return;
        var boardPos = this.pickWhere(mesh => mesh.id == 'board').pickedPoint
        var closestSq = this.getClosestSq(boardPos);
        if (!( closestSq && boardPos )) { // boardPos is false if user clicked off board
            this.resetMove(true)
            return; 
        }
        var squarePos = this.squares[closestSq.sqName].coords
        if (closestSq != this.startingSq) {
            // let move = `{"${this.startingSq.sqName}:"${closestSq.sqName}"}`
            // let pieceAbbrev = this.getPieceNameAbbrev(this.currentPiece)
            let potentialMove = { from: this.startingSq.sqName, to: closestSq.sqName }
            console.log('potential move ', potentialMove)
            // let validMove = this.game.moves().find((move) => {
            //     if (pieceAbbrev == '') 
            //     {    // not good enough, if pawn captures, its starting sq changes file, but is still same file pawn
            //         return move.startsWith(`${this.startingSq.charAt(0)}x${closestSq.sqName}`) 
            //     }
            //     else 
            //         return move.startsWith(potentialMove) 
            // }) 

            let validMove = this.game.move(potentialMove)

            console.log('valid move ', validMove)
            console.log('possible moves '+ this.game.moves())
            
            if (validMove) {
                this.currentPiece.position = new BABYLON.Vector3(squarePos.x, this.currentPiece.position.y, squarePos.z)
                // this.whitesTurn = !this.whitesTurn                
                // todo: after move, check if gameover, if so how 'time/checkmate/3foldrep..'
            } else {
                // todo: if not valid move highlight square red for .5 secs
                this.resetMove(true)
            }

            this.resetMove() // go back if !valid
        }
        else {
            this.currentPiece.position = this.startingPos // if on same sq, dont reset move, but go back to starting pos on sq
            this.isDragging = false 
        }
        // todo: set new current square indicator (change tile material diffuse)
        return;
    }

    // todo: this function needs to run in a renderLoop(throttled)
    onPointerMove (evt) {
        if (!( this.isDragging && this.startingPos )) return;
        var boardPos = this.pickWhere(mesh => mesh.id == 'board').pickedPoint
        if (!boardPos) return;
        // console.log('currentPiece',this.currentPiece)
        // var diff = boardPos.subtract(this.dragPos || this.startingPos);
        // var moveVector = new BABYLON.Vector3(diff.x, 0, diff.z)
        // var newPos = this.currentPiece.position.addInPlace(moveVector);

        this.currentPiece.position = boardPos

        // this.dragPos = boardPos;
    }

    resetMove(goBack){
        if (goBack && this.currentPiece) this.currentPiece.position = this.startingPos
        this.startingPos = null;
        this.startingSq = null;
        this.currentPiece = null;
        // this.dragPos = null;
        this.isSelecting = false;
        this.legalSquares = null;
        this.selectedHighlightLayer.removeAllMeshes();
    }

    getClosestSq(startingPos){
        let pickedPoint = startingPos || this.pickWhere().pickedPoint
        if (!pickedPoint) return
        var closest = { sqName: '', dist: 999 }; 
        for (const sqName in this.squares) {
            let dist = BABYLON.Vector3.Distance(pickedPoint, this.squares[sqName].coords)
            // console.log('dist', dist)
            if (dist < closest.dist){
                closest = { sqName: sqName, dist: dist }
            }            
        }
        // console.log('closest sq', closest)
        return this.squares[closest.sqName]
    }

    getPieceNameAbbrev(piece){
        let abbrev = piece.name.charAt(0)
        return (abbrev != 'P') ? abbrev : ''
    }

    pickWhere (predicate) {
        return this.scene.pick(this.scene.pointerX, this.scene.pointerY, predicate)
    }

    // calcDistance(p1, p2){
    //     return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2)
    // }

    createBoard(){
        const whiteMaterial = new BABYLON.StandardMaterial("White");
        whiteMaterial.diffuseColor = new BABYLON.Color3(0.97, 0.98, 0.85);
        whiteMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
        // whiteMaterial.backFaceCulling = false
        const blackMaterial = new BABYLON.StandardMaterial("Black");
        blackMaterial.diffuseColor = new BABYLON.Color3(0.50, 0.64, 0.35);
        blackMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
        // blackMaterial.backFaceCulling = false

        var board = BABYLON.Mesh.CreateBox("board", 16, this.scene); // should be an invisible ground under Tiled Ground
        board.scaling.y = .033;
        board.position = new BABYLON.Vector3(0, -.3, 0);
        board.material = whiteMaterial;
        board.isPickable = false; // if falseget from scene.pick(x,y,null)
        console.log('board',board)

        // var ground = BABYLON.MeshBuilder.CreateGround("ground", {width: 200, height: 200}, this.scene);
        // ground.material = new BABYLON.StandardMaterial("ground_texture", this.scene);
        // ground.material.diffuseColor = new BABYLON.Color3(0.19, 0.18, 0.17);
        // ground.material.specularColor = new BABYLON.Color3(0, 0, 0);
        // ground.material.metallicTexture = null;
        // ground.isPickable = false; 
        // ground.position = new BABYLON.Vector3(0, -.7, 0);
        // ground.receiveShadows = true;

        const multimat = new BABYLON.MultiMaterial("multi", this.scene);
        multimat.subMaterials.push(blackMaterial, whiteMaterial);
        // multimat.diffuseColor = new BABYLON.Color3(0.8, 0.8, 0.8);
        // multimat.specularColor = new BABYLON.Color3(0.5, 0.5, 0.5);
        // multimat.specularPower = 32;

        // dynamic/programmatically generate grid & coordinates
        let grid = { 'h' : 8, 'w' : 8 }
        const boardTiles = new BABYLON.MeshBuilder.CreateTiledGround("Chess_Board", {xmin: -8, zmin: -8, xmax: 8, zmax: 8, subdivisions: grid});
        boardTiles.position = new BABYLON.Vector3(0,0,0)
        boardTiles.material = multimat;
        const verticesCount = boardTiles.getTotalVertices(); // Needed variables to set subMeshes
        const tileIndicesLength = boardTiles.getIndices().length / (grid.w * grid.h);
        boardTiles.subMeshes = [];
        let base = 0;
        let tilesCreated = 0
        let yCoord = -7
        for (let row = 0; row < grid.h; row++) {
            let xCoord = -7
            for (let col = 0; col < grid.w; col++) {
                let sqName = `${String.fromCharCode(col + 97)}${row + 1}`
                let squareDef =  new BABYLON.SubMesh(row % 2 ^ col % 2,  0, verticesCount, base, tileIndicesLength, boardTiles)
                let square = boardTiles.clone(sqName)
                square.subMeshes = [squareDef.clone(square, square)] // could deconstruct mesh alternatively https://doc.babylonjs.com/toolsAndResources/utilities/Deconstruct_Mesh
                square.isPickable = false
                square.id = sqName
                square.name = sqName
                // square.materialIndex = materials[row % 2 ^ col % 2]
                // let square = boardTiles.subMeshes[tiles]
                this.squares[sqName] = { sqName, coords:new BABYLON.Vector3(xCoord, 0, yCoord), mesh:square}
                base += tileIndicesLength;
                tilesCreated += 1
                // console.log('Sq Name(col, row)',`${sqName}(${col}, ${row})`)
                // console.log(`Sq coords ${xCoord}, ${yCoord}`)
                // console.log('______________________')
                xCoord += 2
            }
            yCoord += 2
        }
       
        setTimeout(()=>{ boardTiles.dispose() },100)

        console.log('board',this.squares)
        return board
    }
    


}


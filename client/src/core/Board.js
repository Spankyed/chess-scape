export default class Board {
    constructor(current, scene, canvas){
        // Board class depends on Game class & current Scene class
        // this.Scene = Scene
        this.scene = scene;  
        this.game = current.game
        this.pieces = current.pieces
        this.squares = {}
        this.fadedPieces = []
        this.capturedPiecesCount = {white:0, black:0}
        this.playerColor = 'white'
        this.playerCanMove = true;
        this.isMoving = false;
        this.isDragging = false;
        this.fromSq = {};
        this.toSq = {};
        this.selectedHighlightLayer = new BABYLON.HighlightLayer("selected_sq", this.scene);
        this.setupEventHandlers(canvas)
        this.board = this.createBoard()
        return 
    }
    setupEventHandlers(canvas) {
        const handlers =  {   
            onPointerDown: (evt) => this.onPointerDown(evt),
            onPointerUp: (evt) => this.onPointerUp(evt),
            onPointerMove: (evt) => this.onPointerMove(evt),
            onRightPointerDown: (evt) => { if (evt.button == 2) this.resetMove(true) }
        }
        // todo: consider using rxjs fromEvent here?
        canvas.addEventListener("pointerdown", handlers.onPointerDown, false);
        canvas.addEventListener("pointerup", handlers.onPointerUp, false);
        canvas.addEventListener("pointermove", handlers.onPointerMove, false);
        canvas.addEventListener("contextmenu", handlers.onRightPointerDown, false);
        this.scene.onDispose = function () {
            canvas.removeEventListener("pointerdown", handlers.onPointerDown);
            canvas.removeEventListener("pointerup", handlers.onPointerUp);
            canvas.removeEventListener("pointermove", handlers.onPointerMove);
            canvas.removeEventListener("contextmenu", handlers.onRightPointerDown);
        }
        return this.scene;
    };

    // remove scene and ground
    onPointerDown(evt) {
        if (evt.button !== 0) return;
        if (!this.game().inReview && (this.game().game_over || !this.playerCanMove)) return;
        let pickInfo = this.pickWhere((mesh) => mesh.isPickable); // select square
        // console.log('picked sq',pickInfo.pickedMesh)
        if (!pickInfo.hit) return;
        if (this.fromSq.mesh == pickInfo.pickedMesh){
            this.resetMove(true)
            return
        }
        let piece = this.squares[pickInfo.pickedMesh.name].piece
        if (!piece) return
        let pieceColor = this.getColorFromPiece(piece)
        // if (!this.game().inReview && (pieceColor !== this.playerColor)) return // !only allow enemy piece selection in
        let fromPieceColor = this.getColorFromPiece(this.fromSq.piece)
        if (fromPieceColor && (pieceColor != fromPieceColor)) return // user is in review & trying to eat, dont select new piece
        this.fromSq = this.squares[pickInfo.pickedMesh.name]; // select piece/sq
        if (!(this.fromSq && this.fromSq.piece)) return; // exit if no piece on square (no need to reset; overrides); check perhaps unnecessary duplicate
        // todo: change cursor back to grabbing
        this.selectedHighlightLayer.removeAllMeshes();
        this.selectedHighlightLayer.addMesh(this.fromSq.mesh, BABYLON.Color3.Yellow()); // highlight selected square/piece
        this.isMoving = true;
        this.isDragging = true
    }

    onPointerUp(evt) {
        if (evt.button == 2) return; // ignore right click
        if (!( this.isMoving && this.fromSq )) return;
        let pickInfo = this.pickWhere(mesh => mesh.isPickable)
        if (!pickInfo.hit) { // is false if user clicked off board
            this.resetMove(true)
            return; 
        }
        this.toSq = this.squares[pickInfo.pickedMesh.name];
        if (this.toSq == this.fromSq) {
            // if mouseup on same sq, reposition piece at center of starting sq, dont completely reset
            this.changePosition(this.fromSq.piece, this.fromSq.coords.clone())
            this.isDragging = false 
        } else {
            let potentialMove = { from: this.fromSq.sqName, to: this.toSq.sqName }
            this.attemptGameMove(potentialMove)
            // console.log('valid move ', validMove)
            // console.log('possible moves '+ this.game().moves())
        }
        // todo: set prev move indicator on square (change tile material diffuse)
        return;
    }

    // todo: this function needs to run in a renderLoop(throttled)
    onPointerMove (evt) {
        // todo: change cursor back to grab, if not grabbing
        if (!( this.isDragging && this.fromSq )) return;
        // todo drag piece along sides of board if mouse is off board
        let boardPos = this.pickWhere(mesh => mesh.id == 'board').pickedPoint
        if (!boardPos) return;
        let closestSqPiece = this.getClosestSq(boardPos).piece
        if(closestSqPiece && closestSqPiece != this.fromSq.piece){
            this.restoreFadedPieces()
            closestSqPiece.visibility = 0.35
            this.fadedPieces.push(closestSqPiece)
        } else if(this.fadedPieces.length > 0){
            this.restoreFadedPieces()
        }
        this.changePosition(this.fromSq.piece, boardPos.clone())
    }
    pickWhere (predicate) {
        return this.scene.pick(this.scene.pointerX, this.scene.pointerY, predicate)
    }
    async attemptGameMove(potentialMove){
        if (!this.game().inReview) this.playerCanMove = false
        let validMove = await this.game().handleUserMove(potentialMove)
        if (!validMove && !this.game().inReview) this.playerCanMove = true
        if (validMove) {
            // if(validMove.isPromoting){
            //     this.actions()
            //     this.game().selectPiece
            // }
            this.move(validMove)
        } else {
            // todo: if not valid move highlight square red for .5 secs
            this.resetMove(true) // go back if !validMove
        }
    }
    moveOpponentPiece(move){
        // console.log('moving opponent piece', {piece})
        this.move(move)
        this.playerCanMove = true
    }
    move(gameMove){
        if(!gameMove) return
        // console.log('moving piece', {piece})
        let { from, to, flags} = gameMove
        if (flags) this.handleFlags(gameMove)
        let fromSq = this.squares[from]
        let toSq = this.squares[to]
        this.changePosition(fromSq.piece, toSq.coords)
        this.updateSquares(fromSq, toSq)
        this.resetMove()
    }
    changePosition(piece, newPos){
        let updatedPos = new BABYLON.Vector3(newPos.x, piece.position.y, newPos.z)
        if (!piece.position.equals(updatedPos)) piece.position = updatedPos
    }
    updateSquares(fromSq, toSq){
        toSq.piece = fromSq.piece
        fromSq.piece.sqName = toSq.sqName
        delete fromSq.piece
    }
    handleFlags(move){
        let { from, to, flags} = move
        if (flags && flags.includes('e')) this.captureEnPassant(to)
        else if (flags && flags.includes('c')) this.positionCapturedPiece(this.squares[to].piece)
        let castle;
        if (flags && (castle = flags.match(/k|q/))) this.positionCastledRook(castle[0], to)
        if (flags && flags.includes('p')) console.log('promoted', move)
    }
    positionCastledRook(side, kingSq){
        let rookPositions = { q:{from:'a', to:'d'}, k:{from:'h', to:'f'} } // possible files for castled rook
        let kingRank = kingSq.charAt(1)
        let fromSq = this.squares[rookPositions[side].from + kingRank]
        let toSq = this.squares[rookPositions[side].to + kingRank]
        this.changePosition(fromSq.piece, toSq.coords)
        this.updateSquares(fromSq, toSq)
    }
    captureEnPassant(moveTo) {
        let rankOffSet = {6:5, 3:4} // possible ranks for captured piece, relative to capturing piece
        let file = moveTo.charAt(0)
        let rank = moveTo.charAt(1)
        let capturedPieceSq = file + rankOffSet[rank]
        this.positionCapturedPiece(this.squares[capturedPieceSq].piece)
    }
    positionCapturedPiece(piece){
        piece.sqName = null
        let pieceColor = this.getColorFromPiece(piece)
        const getNextPosition = (pieceColor) =>  {
            let columnsCoords = [10, 11.5, 13]  // start columns 2 units from board(8x8) & spread 1.5 units apart
            let count = this.capturedPiecesCount[pieceColor]++
            let column = count / 8 | 0
            let offsetMultiplier = count % 8 
            let x = columnsCoords[column]
            let z = -6.5 + (1.3 * (offsetMultiplier)) // start piece row at z:-6.5 and move each piece up 1.3 units 
            let coords = pieceColor == 'white' ? [-1*x, 0, -1*z] : [x, 0, z] // invert coords for whites pieces
            return new BABYLON.Vector3(...coords)
        }
        piece.position = getNextPosition(pieceColor)
    }
    resetMove(goBack){
        if (goBack && this.fromSq.piece) this.changePosition(this.fromSq.piece, this.fromSq.coords)
        if (this.fadedPieces.length > 0) this.restoreFadedPieces()
        this.fromSq = {};
        this.toSq = {}
        this.isDragging = false;
        this.isMoving = false;
        this.legalSquares = null;
        this.selectedHighlightLayer.removeAllMeshes();
    }
    restoreFadedPieces() {
        this.fadedPieces.forEach( piece =>  piece.visibility = 1 )
        this.fadedPieces = []
    }
    getClosestSq(fromPos){
        let pickedPoint = fromPos || this.pickWhere().pickedPoint
        if (!pickedPoint) return
        let closest = { sqName: '', dist: 999 }; 
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
    // calcDistance(p1, p2){
    //     return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2)
    // }
    getColorFromPiece(piece){
        if (!piece) return null
        return piece.name.endsWith('white') ? 'white' : 'black'
    }  
    // test setBoardPosition
    // interact.game.engine.load_pgn("1. d4 a6")
    // let map = interact.game.mapBoard(interact.game.engine.board())
    // interact.board.setReviewBoard(map)
    setBoardPosition(boardMap){
        Object.entries(boardMap).forEach(([sq, pieceId]) => {
            // todo: check if squares have 2 pieces, moved & captured pieces
            if(!pieceId){
                this.squares[sq].piece = null
                return
            }
            let piece = this.pieces()[pieceId]
            this.squares[sq].piece = piece
            // console.log('mapped piece', piece)
            piece.sqName = sq
            this.changePosition(piece, this.squares[sq].coords)
        })
        this.selectedHighlightLayer.removeAllMeshes();
    }
    mapPiecesToSquares(pieces){
        pieces.forEach( piece =>{
            let closestSq = this.getClosestSq(piece.position)
            let square = this.squares[closestSq.sqName]
            square.piece = piece
            piece.sqName = closestSq.sqName
            // console.log('closestSq', this.squares[closestSq.sqName])
        })
        // console.log('mapped squares', this.squares)
    }
    createBoard(){
        const whiteMaterial = new BABYLON.StandardMaterial("White");
        whiteMaterial.diffuseColor = new BABYLON.Color3(0.97, 0.98, 0.85);
        whiteMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
        // whiteMaterial.backFaceCulling = false
        const blackMaterial = new BABYLON.StandardMaterial("Black");
        blackMaterial.diffuseColor = new BABYLON.Color3(0.50, 0.64, 0.35);
        blackMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
        // blackMaterial.backFaceCulling = false

        let board = BABYLON.Mesh.CreateBox("board", 1, this.scene); // should be an invisible ground under Tiled Ground
        board.scaling.y = .5;
        board.scaling.x = 16
        board.scaling.z = 16
        board.position = new BABYLON.Vector3(0, -.3, 0);
        board.material = whiteMaterial;
        board.isPickable = false; // if falseget from scene.pick(x,y,null)
        // console.log('board platform', board)

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
                square.isPickable = true
                square.id = sqName
                square.name = sqName
                // square.materialIndex = materials[row % 2 ^ col % 2]
                // let square = boardTiles.subMeshes[tiles]
                this.squares[sqName] = { sqName, coords: new BABYLON.Vector3(xCoord, 0, yCoord), mesh: square, piece: null } // change mesh to tile
                base += tileIndicesLength;
                tilesCreated += 1
                // console.log('Sq Name(col, row)',`${sqName}(${col}, ${row})`)
                // console.log(`Sq coords ${xCoord}, ${yCoord}`)
                // console.log('______________________')
                xCoord += 2
            }
            yCoord += 2
        }
       
        setTimeout(()=>{ boardTiles.dispose() }, 50)

        // console.log('squares', this.squares)
        return board
    }
    
}


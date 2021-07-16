export default class Board {
    constructor(Scene){
        // Board class depends on game class have being instantiated
        // this.Scene = Scene
        this.scene = Scene.scene;  
        this.canvas = Scene.canvas;  
        this.game = Scene.game;
        this.squares = {}
        this.pieces = Scene.pieces
        this.fadedPieces = []
        this.playerColor = 'white'
        this.playerCanMove = true;
        // this.pieces = []
        this.isMoving = false;
        this.fromSq = {};
        this.toSq = {};
        // this.selectedPiece;  
        // this.startingSq 
        // this.dragPos;
        this.selectedHighlightLayer = new BABYLON.HighlightLayer("selected_sq", this.scene);
        this.setupEventHandlers()
        this.board = this.createBoard()
        // this.mapPiecesToSquares()
        return 
    }
    setupEventHandlers() {
        const handlers =  {   
            onPointerDown: (evt) => this.onPointerDown(evt),
            onPointerUp: (evt) => this.onPointerUp(evt),
            onPointerMove: (evt) => this.onPointerMove(evt),
            onRightPointerDown: (evt) => { if (evt.button == 2) this.resetMove(true) }
        }
        // todo: use rxjs fromEvent here
        this.canvas.addEventListener("pointerdown", handlers.onPointerDown, false);
        this.canvas.addEventListener("pointerup", handlers.onPointerUp, false);
        this.canvas.addEventListener("pointermove", handlers.onPointerMove, false);
        this.canvas.addEventListener("contextmenu", handlers.onRightPointerDown, false);
        this.scene.onDispose = function () {
            this.canvas.removeEventListener("pointerdown", handlers.onPointerDown);
            this.canvas.removeEventListener("pointerup", handlers.onPointerUp);
            this.canvas.removeEventListener("pointermove", handlers.onPointerMove);
            this.canvas.removeEventListener("contextmenu", handlers.onRightPointerDown);
        }
        return this.scene;
    };

    // remove scene and ground
    onPointerDown(evt) {
        if (this.game.game_over || !this.playerCanMove) return;
        if (evt.button !== 0) return;
        let pickInfo = this.pickWhere((mesh) => mesh.isPickable);
        console.log('picked sq',pickInfo.pickedMesh)
        if (!pickInfo.hit)  return;
        if (this.fromSq.mesh == pickInfo.pickedMesh){
            this.resetMove(true)
            return
        }

        let piece = this.squares[pickInfo.pickedMesh.name].piece
        if (!piece) return
        let pieceColor = this.getColorFromPiece(piece)
        if (pieceColor !== this.playerColor) return // check if pickedsq piece is enemy piece, then ignore event; pointerUp will handle if it is an eat move

        this.fromSq = this.squares[pickInfo.pickedMesh.name]; // pick new piece
        if (!(this.fromSq && this.fromSq.piece)) return; // if no piece on square, return
        // set piece starting Sq and highlight the square underneath the piece yellow
        // this.startingSq = this.fromSq;
        this.selectedHighlightLayer.removeAllMeshes();
        this.selectedHighlightLayer.addMesh(this.fromSq.mesh, BABYLON.Color3.Yellow());
        this.isMoving = true;
        this.isDragging = true
    }

    onPointerUp(evt) {
        if (evt.button == 2) return;
        if (!( this.isMoving && this.fromSq )) return;
        let pickInfo = this.pickWhere(mesh => mesh.isPickable)
        if (!pickInfo.hit) { // boardPos is false if user clicked off board
            this.resetMove(true)
            return; 
        }
        this.toSq = this.squares[pickInfo.pickedMesh.name];
        if (this.toSq != this.fromSq) {
            // let move = `{"${this.startingSq.sqName}:"${closestSq.sqName}"}`
            // let pieceAbbrev = this.getPieceNameAbbrev(this.selectedPiece)
            let potentialMove = { from: this.fromSq.sqName, to: this.toSq.sqName }
            // console.log('potential move ', potentialMove)
            // let validMove = this.game.moves().find((move) => {
            //     if (pieceAbbrev == '') 
            //     {    // todo: in pgn, check when pawn captures, if its starting sq changes file
            //         return move.startsWith(`${this.startingSq.charAt(0)}x${closestSq.sqName}`) 
            //     }
            //     else 
            //         return move.startsWith(potentialMove) 
            // }) 

            let validMove = this.attemptGameMove(potentialMove)
            // console.log('valid move ', validMove)
            // console.log('possible moves '+ this.game.moves())
            if (validMove) {
                // if(validMove.isPromoting){
                //     this.actions()
                //     this.game.selectPiece
                // }
                // if(validMove.isCastling){
                //     select 
                // }
                console.log('player move', validMove)
                this.movePiece(this.fromSq.piece, this.toSq.coords, potentialMove)
                // this.whitesTurn = !this.whitesTurn                
                // todo: after move, check if gameover, if so how 'time/checkmate/3foldrep..'
            } else {
                // todo: if not valid move highlight square red for .5 secs
                this.resetMove(true)
            }

            this.resetMove() // go back if !valid
        }
        else {
            // if release mouse click on same sq, dont completely reset move, but pos piece at center of starting sq
            this.movePiece(this.fromSq.piece, this.fromSq.coords.clone())
            this.isDragging = false 
        }
        // todo: set prev move indicator on square (change tile material diffuse)
        return;
    }

    // todo: this function needs to run in a renderLoop(throttled)
    onPointerMove (evt) {
        if (!( this.isDragging && this.fromSq )) return;
        // todo drag piece along sides of board if mouse is off board
        let boardPos = this.pickWhere(mesh => mesh.id == 'board').pickedPoint
        if (!boardPos) return;
        // console.log('selectedPiece',this.selectedPiece)

        let closestSqPiece = this.getClosestSq(boardPos).piece
        if(closestSqPiece && closestSqPiece != this.fromSq.piece){
            this.restoreFadedPieces()
            closestSqPiece.visibility = 0.35
            this.fadedPieces.push(closestSqPiece)
        }else if(this.fadedPieces.length > 0){
            this.restoreFadedPieces()
        }

        this.movePiece(this.fromSq.piece, boardPos.clone())
    }

    pickWhere (predicate) {
        return this.scene.pick(this.scene.pointerX, this.scene.pointerY, predicate)
    }
    
    attemptGameMove(potentialMove){
        this.playerCanMove = false
        let validMove = this.game.handleUserMove(potentialMove)
        if (!validMove) this.playerCanMove = true
        return validMove
    }

    movePiece(piece, newPos, gameMove){
        // console.log('moving piece',piece)
        if(gameMove) this.updateBoardPosition(gameMove)
        piece.position = new BABYLON.Vector3(newPos.x, piece.position.y, newPos.z)
    }

    moveOpponentPiece(move){
        // { from: 'a2', to: 'a4' }
        console.log('opponent move', move)
        let piece = this.squares[move.from].piece
        // console.log('goturpiece',piece)
        if (piece) this.movePiece(piece, this.squares[move.to].coords, move)
        this.playerCanMove = true
    }
    
    resetMove(goBack){
        if (goBack && this.fromSq.piece) this.movePiece(this.fromSq.piece, this.fromSq.coords)
        if (this.fadedPieces.length > 0) this.restoreFadedPieces()
        this.fromSq = {};
        this.toSq = {}
        // this.selectedPiece = null;
        // this.dragPos = null;
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
    
    getColorFromPiece(piece){
        return piece.name.endsWith('white') ? 'white' : 'black'
    }
    // getPieceBySq(sqName){
    //     let square = this.squares[sqName]
    //     if (!square) return
    //     var closestPiece = { piece: '', dist: 999 }; 
    //     for (const color in this.pieces) {
    //         let colorPieces = this.pieces[color]
    //         colorPieces.forEach(piece => {
    //             if (piece == this.selectedPiece) return
    //             let dist = BABYLON.Vector3.Distance(piece.position, square.coords)
    //             if (dist < closestPiece.dist) closestPiece = { piece, dist: dist }
    //         })
    //         // console.log('dist', dist)
    //     }
    //     // console.log('closest sq', closest)
    //     return closestPiece.piece
    // }
    // isMoveValid(from, to){
    //     let pieceAbbrev = this.getPieceNameAbbrev(this.selectedPiece)
    //     return !!this.game.moves({ square: from }).find((move) => {
    //         if (pieceAbbrev == '') 
    //         {    // todo: in pgn, check when pawn captures, if its starting sq changes file
    //             return move.startsWith(`${from.charAt(0)}x${to}`) 
    //         }
    //         else 
    //             return move.startsWith(`${this.selectedPiece.name.charAt(0)}${to}`) 
    //     }) 
    // }

    // getPieceNameAbbrev(piece){
    //     let abbrev = piece.name.charAt(0)
    //     return (abbrev != 'P') ? abbrev : ''
    // }



    // calcDistance(p1, p2){
    //     return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2)
    // }

    updateBoardPosition({ from, to}){
        // todo: if pawn changes file, and there isnt a pawn on the "to" square, pawn ate enpessant, dispose pawn
        // todo: if king moves two spaces, then castled: move & updateBoardPosition for rook to other side of king
        if (this.squares[to].piece) this.squares[to].piece.dispose() // move pieces off board instead of dispose
        this.squares[to].piece = this.squares[from].piece
        delete this.squares[from].piece
    }

    mapPiecesToSquares(pieces){
        this.pieces = pieces
        for (const color in this.pieces) {
            let colorPieces = this.pieces[color]
            colorPieces.forEach(piece => {
                let closestSq = this.getClosestSq(piece.position)
                this.squares[closestSq.sqName] = { ...closestSq, piece }
                // console.log('closestSq', this.squares[closestSq.sqName])
                // Object.assign(closestSq, )
            })
        }
        // console.log('squares', this.squares)
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
       
        setTimeout(()=>{ boardTiles.dispose() },100)

        console.log('squares', this.squares)
        return board
    }
    


}


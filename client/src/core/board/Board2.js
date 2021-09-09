export default class Board {
    constructor(current, scene, canvas){
        // Board class depends on Game class & current Scene class
        // this.Scene = Scene
        this.scene = scene; 
        this.current = current 
        this.game = current.game
        this.pieces = current.pieces
        this.squares = {}
        this.fadedPieces = []
        this.capturedPieces = {count:{w:0,b:0}}
        this.playerColor = 'white'
        this.playerCanMove = true;
        this.isMoving = false;
        this.isDragging = false;
        this.inReview = false;
        this.fromSq = {};
        this.toSq = {};
        this.selectedHighlightLayer = new BABYLON.HighlightLayer("selected_sq", this.scene);
        this.setupEventHandlers(canvas)
        this.board = this.createBoard() // var not used
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
    // pointer down only selects a piece, never captures
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
        // if (!this.game().inReview && (pieceColor !== this.playerColor)) return // !disable enemy piece selection unless reviewing
        let fromPieceColor = this.getColorFromPiece(this.fromSq.piece)
        if (fromPieceColor && (pieceColor != fromPieceColor)) return // user is in review & trying to capture, dont select new piece
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
            console.log('same',this.toSq,this.fromSq)
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
        if (closestSqPiece && closestSqPiece != this.fromSq.piece){
            this.restoreFadedPieces()
            closestSqPiece.visibility = 0.35
            this.fadedPieces.push(closestSqPiece)
        } else if (this.fadedPieces.length > 0){
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
        if (flags) {
            let promoted = this.handleFlags(gameMove)
            if (promoted) {
                this.resetMove()
                if (!this.inReview) this.addMoveForReview(gameMove)
                return
            }
        }
        //code below never reached, aways flags
        let fromSq = this.squares[from]
        let toSq = this.squares[to]
        this.changePosition(fromSq.piece, toSq.coords)
        this.updateSquares(fromSq, toSq)
        if (!this.inReview) this.addMoveForReview(gameMove)
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
        if (flags && flags.includes('p')) {
            this.addPromotionPiece(move)
            return true
        }
        return false
    }
    addMoveForReview(move){
        let boardMap = this.mapBoard()
        // console.log('added',{move,boardMap})
        this.current.uiActions.sidePanel.moves.addMove({move, fen: this.game().engine.fen(), boardMap: boardMap})
    }
    addPromotionPiece({color, promotion, from, to}){
        console.log('promoted', {color, promotion, from,  to})
        let pieceId = `${promotion}_${color}`
        let firstPiece = this.pieces()[pieceId]
        let promotionPiece = firstPiece.clone(firstPiece.name +  '_clone')
        let count = Object.entries(this.pieces()).filter(([id]) => id.startsWith(pieceId)).length;
        promotionPiece.makeGeometryUnique()
        promotionPiece.id = `${pieceId}_${count+1}_p`
        // promotionPiece.name = firstPiece.name +  '_clone'
        this.pieces()[promotionPiece.id] = promotionPiece
        let toSq = this.squares[to]
        let fromSq = this.squares[from]
        // fromSq.piece.setEnabled(false) 
        // this.promotedPawns.push[fromSq.piece]
        toSq.piece = promotionPiece
        let pawn = fromSq.piece
        pawn.isVisible = false //hide pawn
        pawn.sqName = null
        promotionPiece.sqName = to
        // console.log('deleting',fromSq.piece)
        delete this.squares[from].piece
        this.changePosition(promotionPiece, toSq.coords)

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
        // if(!piece) debugger
        if(!this.inReview) this.capturedPieces[piece.id] = piece
        piece.sqName = null
        let pieceColor = this.getColorFromPiece(piece)
        const getNextPosition = (pieceColor) =>  {
            let columnsCoords = [10, 11.5, 13]  // start columns 2 units from board(8x8) & spread 1.5 units apart
            let count = this.capturedPieces.count[pieceColor.charAt(0)]++
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
        return piece.name.match(/white|black/)[0]
    }  
    // test setBoardPosition
    // interact.game.engine.load_pgn("1. d4 a6")
    // let map = interact.game.mapBoard(interact.game.engine.board())
    // interact.board.setReviewBoard(map)

    // setBoardPosition(boardMap){
	//     let expectedCount = {'p':8,'r':2,'n':2,'b':2,'q':1,'k':1}
    //     Object.entries(boardMap).forEach(([sq, pieceId]) => {
    //         // todo: check if squares have 2 pieces, moved & captured pieces
    //         if(!pieceId){
    //             this.squares[sq].piece = null
    //             return
    //         }
    //         if (parseInt(pieceId?.slice(-1)) > expectedCount[pieceId.charAt(0)]) pieceId = pieceId + '_p'
    //         let piece = this.pieces()[pieceId]
    //         if(!piece){
    //             console.log('fkk')
    //             debugger
    //         }
    //         this.squares[sq].piece = piece
    //         // console.log('mapped piece', piece)
    //         piece.sqName = sq
    //         if (!piece.isEnabled()) piece.setEnabled(true)
    //         this.changePosition(piece, this.squares[sq].coords)
    //     })
    //     this.selectedHighlightLayer.removeAllMeshes();
    // }
    setBoardPosition(boardMap, curr){
        boardMap = curr ? this.currBoardMap : boardMap
        let mappedPieces = []
        boardMap.forEach(({sqName, id, position, isVisible}) => {
            let piece = this.pieces()[id]
            piece.position = position.clone()
            piece.sqName = sqName
            piece.isVisible = isVisible
            // piece.setEnabled(isEnabled)
            if (sqName){
                let sq = this.squares[sqName]
                sq.piece = piece
            }
            mappedPieces.push(id)
        })
        let removedPromotionPieces = Object.entries(this.pieces()).filter(([key, piece])=>{
            return !mappedPieces.includes(key)
        })
        // console.log({removedPromotionPieces})
        removedPromotionPieces.forEach( ([id, piece]) => piece.isVisible = false)
        Object.entries(this.squares).forEach(([key, sq])=>{ if (sq.piece &&  sq.piece.sqName != key) {
            console.log('deleted')
            delete sq.piece
        }})
        this.selectedHighlightLayer.removeAllMeshes();
    }
    mapBoard(){
        let map = []
        // could also record this.capturedPieces for better consistency
        Object.entries(this.pieces()).forEach(([key, piece])=>{
            let {id, sqName, position} = piece
            // if(sqName && !this.squares[sqName].piece)debugger
            sqName = sqName && this.squares[sqName].piece ? sqName : null
            map.push({ 
                id, sqName, 
                position: position.clone(),
                isVisible: piece.isVisible
            })
        })
        this.currBoardMap = map
        return map
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

        const multiMaterial = new BABYLON.MultiMaterial("multi", this.scene);
        multiMaterial.subMaterials.push(blackMaterial, whiteMaterial);
        // multiMaterial.diffuseColor = new BABYLON.Color3(0.8, 0.8, 0.8);
        // multiMaterial.specularColor = new BABYLON.Color3(0.5, 0.5, 0.5);
        // multiMaterial.specularPower = 32;

        const grid = {xmin: -8, zmin: -8, xmax: 8, zmax: 8, subdivisions: { 'h' : 8, 'w' : 8 }}
        const boardTiles = new BABYLON.MeshBuilder.CreateTiledGround("Chess_Board", grid)
        const totalVertices = boardTiles.getTotalVertices() // Needed for subMeshes
        const gridIndices = boardTiles.getIndices().length / (grid.w * grid.h);
		boardTiles.subMeshes = [];
		boardTiles.position = new BABYLON.Vector3(0,0,0)
        boardTiles.material = multiMaterial;
        boardTiles.subMeshes = [];

        let boardMap = Array(8).fill(Array(8).fill())
		this.squares = boardMap.reduce((ranks, rank, rIdx) => {
			let rankSquares = rank.reduce((squares, file, fIdx) => {
                let xCoord = -7 + (2 * fIdx)
                let yCoord = -7 + (2 * rIdx)
                let sqName = `${String.fromCharCode(fIdx + 97)}${rIdx + 1}`
				let startIdx = fIdx * gridIndices + (rIdx * 48); // slide over 48 indices for every rank
				let materialIdx = rIdx % 2 ^ fIdx % 2
                let squareDef = new BABYLON.SubMesh(materialIdx, 0, totalVertices, startIdx, gridIndices, boardTiles)
                // let sq = new BABYLON.Mesh(sqName, this.scene);
                let sq = boardTiles.clone(sqName) // could deconstruct mesh alternatively https://doc.babylonjs.com/toolsAndResources/utilities/Deconstruct_Mesh
                sq.subMeshes = [squareDef.clone(sq, sq)] 
				let sqState = { sqName, coords: new BABYLON.Vector3(xCoord, 0, yCoord), mesh: sq, piece: null }
				return {...squares, [sqName]: sqState}
			},{})
			return {...ranks, ...rankSquares}
		},{});
        
        setTimeout(()=>{ boardTiles.dispose() }, 50)

        // console.log('squares', this.squares)
        return board
    }
    
}


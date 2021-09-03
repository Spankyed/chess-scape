
import { createMachine, actions, interpret, assign, send } from 'xstate';
import { ClonePiece } from './utils/utils'; 

function setupStateMachine(game, squares){
	const moveMachine = createMachine({
		id: 'move_states',
		initial: 'moving',
		context: {
            squares: squares,
			currPlayer: 'white',
			colorToMove: 'white',
			fromSq: undefined,
			toSq: undefined,
			lastMove: undefined,
			// inReview: false,
		},
		states: {
			moving: {
				initial: 'notSelected',
				states:{
					notSelected: { 
						id: 'notSelected',
                        // entry:{} // should deselect, reset move  
					},
					selected: {
						initial: 'dragging',
						states: {
							dragging: {
								//  entry/exit toggle cursor to drag
                                // entry: 'showGrabCursor',
                                // exit: 'releaseGrabCursor',
								on: {
									'DRAG': {
										actions: assign({ dragPos: (_, event) => event.value })
									},
									'END_DRAG': 'notDragging' 
								}
							},
							notDragging: {
								on: {
									'DESELECT': {
										actions: assign({ fromSq: undefined }),
										target: '#notSelected'
									}
								},
							}
						},
						on: {
							'ATTEMPT_MOVE': {
								actions: [ 
									assign({ toSq: (_, event) => event.value }) 
								],
								target: 'validatingMove'
							}
						}
					},
					validatingMove: {
						invoke:{
                            // needs to be a promise to handle promotion piece selection
							src: (ctx, event) => (trigger, onReceive) => {
                                let move = { from: ctx.fromSq.sqName, to: ctx.toSq.sqName }
                                let validMove = game().checkMove(move)
                                // console.log('isValid',{validMove})
                                trigger({type: validMove ? 'ALLOW' : 'DENY', value: validMove })
							}
						},
						on: {
                            'ALLOW': {
                                // todo: indicate square of prev move (change tile material color)
								actions: [ 
                                    assign({ 
                                        lastMove: (ctx, event) => ({
                                            from: ctx.fromSq.sqName,
                                            to: event.value.to
                                        }),
                                        fromSq: undefined, toSq: undefined, // todo flip above for readability
                                    }) 
                                ],
								target: '#waiting'
							},
							'DENY': {
                                // actions: assign({ fromSq: undefined, toSq: undefined }),
								target: 'notSelected'
							}
						}
					}
				},
				on: {
					'SELECT': {
                        // cond: ({ age }) => age >= 18, 
						actions: [
							assign({ fromSq: (ctx, event) => event.value })
						],
						target: '.selected',
						// in: '#light.red.stop'
					}
				}
			},
			waiting: {
				id: 'waiting',
				on: {
                    // '': { actions: assign({ fromSq: undefined, toSq: undefined }) }, infinite loop
					'OPP_MOVE': {
						actions: assign({ lastMove: (_, event) => event.value }),
						target: 'moving'
					}
				}
			}
		},
        on:{
            'UPDATE': {
                actions: assign({ 
                    squares: (ctx, event) => {
                        let squares = event.value
                        return ({
                            ...ctx.squares,
                            ...squares.reduce( (sqs, {name, piece}) => ({...sqs, [name]:{...ctx.squares[name], piece}}), {})
                        })
                    } 
                })
            }
        }
	})
	return interpret(moveMachine)
		// .onTransition((state) => console.log('state changed', state))
		// .onTransition((state) => console.log('state changed', state.value))
		.start();
}

export default function Board(current, scene, canvas){
	let game = current.game,
	pieces = current.pieces,
	fadedPieces = [],
	capturedPieces = {count:{w:0,b:0}},
	[board, squares] = createBoard(scene), // board var not used
	selectedHighlightLayer = new BABYLON.HighlightLayer("selected_sq", scene),
	moveService = setupStateMachine(game, squares);
	// $moveState = subscribeChanges(moveService)
	subscribeChanges(moveService)
	setupClickListeners(canvas)

	// cleanupState(){ this.stateSubscription.unsubscribe()}
    function subscribeChanges(moveService){
        return moveService.subscribe((state) => {
            let { event, context } = state
            let { type, value } = event
            // console.log('ohh boy', {state})
            if (!state.changed) return
            // console.log('ohh boy!', {state})
            const eventHandlers = {
                'SELECT': selectSq,
                'DESELECT': deselectSq,
                'DRAG': dragPiece,
                'END_DRAG': endPieceDrag,
                'RESET': resetMove,
                // 'ATTEMPT_MOVE': attemptMove,
                'ALLOW': handleMove,
                'DENY': deselectSq,
        	}
            eventHandlers[type]?.(value, state)
        });
    }

	function setupClickListeners(canvas) {
        canvas.addEventListener("pointerdown", onPointerDown, false);
        canvas.addEventListener("pointermove", onPointerMove, false); // todo: rxjs fromEvent to throttle
        canvas.addEventListener("contextmenu", onRightPointerDown, false);
        canvas.addEventListener("pointerup", onPointerUp, false);
        scene.onDispose = () => {
            canvas.removeEventListener("pointerdown", onPointerDown);
            canvas.removeEventListener("pointermove", onPointerMove);
            canvas.removeEventListener("contextmenu", onRightPointerDown);
            canvas.removeEventListener("pointerup", onPointerUp);
        }
    };
    // pointer down only selects a piece, never captures
	function onPointerDown(evt) {
	    const { send, state } = moveService
        if (evt.button !== 0) return;
        let pickInfo = pickWhere( mesh => mesh.isPickable); // pick square
        if (!pickInfo.hit) return; // todo if click missed the whole board deselect?
        let square = squares[pickInfo.pickedMesh.name]
        // if (!square.piece) return // !cannot move to new sq with this
        // if user is in review & trying to capture, dont select enemy piece
        // !only allow enemy piece selection in review
        let sameSq = square === state.context.fromSq
        let colorsMatch = getColor(square.piece) == getColor(state.context.fromSq?.piece)
        let isMove = state.matches('moving.selected') && !colorsMatch
        if (isMove){ 
            send({ type: "ATTEMPT_MOVE", value: square })
        }
        else if (state.matches('moving.selected') && sameSq) {
            send({ type: "DESELECT", value: square })
        }
        else if (state.matches('moving')) {
            send({ type: "SELECT", value: square })
        }
    }

    function onPointerUp(evt) {
	    const { send, state } = moveService
        if (evt.button == 2) return; // ignore right click
        if (!state.matches('moving.selected.dragging')){ return; } // ignore pointer up unless dragging 
        let pickInfo = pickWhere(mesh => mesh.isPickable)
        if (!pickInfo.hit) { send({ type: "DESELECT", value: boardPos }) } // user dragged off board
        let square = squares[pickInfo.pickedMesh.name];
        let sameSq = square === state.context.fromSq
        let pieceColorsMatch = getColor(square.piece) == getColor(state.context.fromSq?.piece)
        if (sameSq){ 
            send({ type: "END_DRAG"}) 
        }// repositions piece in center of starting sq
        else if (!pieceColorsMatch){ 
            send({ type: "ATTEMPT_MOVE", value: square }) 
        }
    }

    function onPointerMove(evt) {
	    const { send, state } = moveService
        // todo: change cursor back to default, if not grabbing
        // console.log('hmm',moveService.state.matches("moving.selected"),state.matches("moving.selected"))
        if (!state.matches("moving.selected.dragging")) return
        let boardPos = pickWhere(mesh => mesh.id == 'board').pickedPoint
        if (!boardPos) return; // todo drag piece along sides of board if mouse is off board (!boardPos)
        // send({ type: "DRAG", value: boardPos, fade: square.piece })
        send({ type: "DRAG", value: boardPos })
    }

    function onRightPointerDown(evt) {
	    const { send, state } = moveService
        //   state.matches(["moving.selected.dragging","reviewing.selected.dragging"])
        if (state.matches("moving.selected.dragging")){ 
            send({ type: "END_DRAG" }) 
        }
        // else if (state.matches("moving.selected.notDragging")) send({ type: "DESELECT" })
        else { 
            send({ type: "DESELECT" }) 
        }
    }

	function pickWhere (predicate) { return scene.pick(scene.pointerX, scene.pointerY, predicate) }
    function selectSq(fromSq, state){
		// console.log('selected',{fromSq, history:state.history.context})
        // todo: change cursor back to grabbing
        if(state.history.context.fromSq){
            let {piece, coords} = state.history.context.fromSq
            changePosition(piece, coords) // reset prev piece
        }
        selectedHighlightLayer.removeAllMeshes();
        selectedHighlightLayer.addMesh(fromSq.mesh, BABYLON.Color3.Yellow()); // highlight
    }
    function deselectSq(){
        // todo: change cursor back to grabbing
        // todo: reset piece position?
        selectedHighlightLayer.removeAllMeshes();
    }
    function dragPiece(position, state){
        let { fromSq } = state.context
        // console.log('dragging',{position: position.clone(),state})
        changePosition(fromSq.piece, position.clone())
        // if drag over another piece fade piece
        // else restore any faded pieces 

        // let closestSqPiece = this.getClosestSq(boardPos).piece
        // if (event.faded){
        //     this.restoreFadedPiece()
        //     event.faded.visibility = 0.35
        // } else if (state.context.fadedPiece.length > 0){
        //     this.restoreFadedPiece()
        // }
    }
    function endPieceDrag(_, state){
        let { fromSq } = state.context
		changePosition(fromSq.piece, fromSq.coords)
		// resetMove(fromSq, true)
    }
    function fadePiece(piece){ piece.visibility = 0 } //!
    function handleMove(move, state){
        console.log('handling move', {move})
	    const { send } = moveService
        let { from, to, flags, promotion} = move
        // if (flags) { handleFlags(gameMove) }
        let fromSq = squares[from]
        let toSq = squares[to]
        changePosition(fromSq.piece, toSq.coords)
        updateSquares(state.context)
        deselectSq()
        // if (!this.inReview) this.addMoveForReview(gameMove)
        function updateSquares({lastMove, squares}){
            let piece = squares[lastMove.from].piece
            let sqs = [{name:lastMove.to, piece},{name:lastMove.from, piece:null}]
            send({type: 'UPDATE', value: sqs})
            // toSq.piece = fromSq.piece
            // fromSq.piece.sqName = toSq.sqName
            // delete fromSq.piece
        }
    }
    function handleFlags(move){
        let castle, { from, to, flags} = move
        if (flags.includes('p')){ addPromotionPiece(move) } 
        if (flags.includes('e')){ captureEnPassant(to) }  
        else if (flags.includes('c')){ positionCapturedPiece(squares[to].piece) } 
        else if ((castle = flags.match(/k|q/))){ positionCastledRook(castle[0], to)  } 
        // return false
    }
    // ______________________________________________________________________________________________________
    function captureEnPassant(moveTo) {
        let rankOffSet = {6:5, 3:4} // possible ranks for captured piece, relative to capturing piece
        let file = moveTo.charAt(0)
        let rank = moveTo.charAt(1)
        let capturedPieceSq = file + rankOffSet[rank]
        this.positionCapturedPiece(this.squares[capturedPieceSq].piece)
    }
    function positionCapturedPiece(piece){
        if(!this.inReview) this.capturedPieces[piece.id] = piece
        // piece.sqName = null
        let pieceColor = getColor(piece)
        const getNextPosition = (pieceColor) =>  { //!
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
    function addPromotionPiece({color, promotion, from, to}){
        console.log('promoted', {color, promotion, from,  to})
        let promotionPiece = ClonePiece({pieces: pieces(), color, type: promotion})
        pieces()[promotionPiece.id] = promotionPiece
        let toSq = squares[to]
        let fromSq = squares[from]
        // fromSq.piece.setEnabled(false) 
        // this.promotedPawns.push[fromSq.piece]
        toSq.piece = promotionPiece
        let pawn = fromSq.piece
        pawn.isVisible = false //hide pawn
        pawn.sqName = null
        // promotionPiece.sqName = to
        delete this.squares[from].piece
        this.changePosition(promotionPiece, toSq.coords)

    }
    function positionCastledRook(side, kingSq){
        let rookPositions = { q:{from:'a', to:'d'}, k:{from:'h', to:'f'} } // possible files for castled rook
        let kingRank = kingSq.charAt(1)
        let fromSq = this.squares[rookPositions[side].from + kingRank]
        let toSq = this.squares[rookPositions[side].to + kingRank]
        this.changePosition(fromSq.piece, toSq.coords)
        this.updateSquares(fromSq, toSq)
    }


    // ______________________________________________________________________________________________________
    function addMoveForReview(move){
        let boardMap = this.mapBoard()
        // console.log('added',{move,boardMap})
    }
    function resetMove(fromSq, goBack){
        console.log('resetting',{fromSq, goBack})
        if (goBack) changePosition(fromSq.piece, fromSq.coords)
        // if (this.fadedPieces.length > 0) restoreFadedPieces(fadedPieces)
        selectedHighlightLayer.removeAllMeshes();
        // this.fromSq = {};
        // this.toSq = {}
        // this.isDragging = false;
        // this.isMoving = false;
    }
    function restoreFadedPieces(fadedPieces) {
        fadedPieces.forEach( piece =>  piece.visibility = 1 )
        fadedPieces = []
    }
    function changePosition(piece, newPos){
        let updatedPos = new BABYLON.Vector3(newPos.x, piece.position.y, newPos.z)
        if (!piece.position.equals(updatedPos)) piece.position = updatedPos
    }
    function getColor(piece){ //!
        if (!piece) return null
        return piece.name.match(/white|black/)[0]
    }
    function getClosestSq(fromPos){ //!
        let pickedPoint = fromPos || pickWhere().pickedPoint
        if (!pickedPoint) return
        let closest = { sqName: '', dist: 999 }; 
        for (const sqName in squares) {
            let dist = BABYLON.Vector3.Distance(pickedPoint, squares[sqName].coords)
            // console.log('dist', dist)
            if (dist < closest.dist){
                closest = { sqName: sqName, dist: dist }
            }            
        }
        // console.log('closest sq', closest)
        return squares[closest.sqName]
    }
    function mapPiecesToSquares(pieces){ //!
        pieces.forEach( piece =>{
            let closestSq = getClosestSq(piece.position)
            let square = squares[closestSq.sqName]
            square.piece = piece
            // piece.sqName = closestSq.sqName
            // console.log('closestSq', squares[closestSq.sqName])
        })
        // console.log('mapped squares', squares)
    }

    return {
        mapPiecesToSquares
    }

}


function createBoard(scene){ //!
    const whiteMaterial = new BABYLON.StandardMaterial("White");
    whiteMaterial.diffuseColor = new BABYLON.Color3(0.97, 0.98, 0.85);
    whiteMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
    // whiteMaterial.backFaceCulling = false
    const blackMaterial = new BABYLON.StandardMaterial("Black");
    blackMaterial.diffuseColor = new BABYLON.Color3(0.50, 0.64, 0.35);
    blackMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
    // blackMaterial.backFaceCulling = false

    let board = BABYLON.Mesh.CreateBox("board", 1, scene); // should be an invisible ground under Tiled Ground
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

    const multiMaterial = new BABYLON.MultiMaterial("multi", scene);
    multiMaterial.subMaterials.push(blackMaterial, whiteMaterial);
    // multiMaterial.diffuseColor = new BABYLON.Color3(0.8, 0.8, 0.8);
    // multiMaterial.specularColor = new BABYLON.Color3(0.5, 0.5, 0.5);
    // multiMaterial.specularPower = 32;
    
    const grid = { 'h' : 8, 'w' : 8 }
    const bounds = { xmin: -8, zmin: -8, xmax: 8, zmax: 8 }
    const boardTiles = new BABYLON.MeshBuilder.CreateTiledGround("Chess_Board", {...bounds, subdivisions: grid})
    const totalVertices = boardTiles.getTotalVertices() // Needed for subMeshes
    const gridIndices = boardTiles.getIndices().length / (grid.w * grid.h);
    boardTiles.position = new BABYLON.Vector3(0,0,0)
    boardTiles.material = multiMaterial;
    boardTiles.subMeshes = [];

    let boardMap = Array(8).fill(Array(8).fill())
    let squares = boardMap.reduce((ranks, rank, rIdx) => {
        let rankSquares = rank.reduce((squares, file, fIdx) => {
            let next = n => -7 + (2 * n)
            let coords = {x: next(fIdx), y: next(rIdx)}
            let materialIdx = rIdx % 2 ^ fIdx % 2
            let startIdx = fIdx * gridIndices + (rIdx * 48); // slide over 48 indices for every rank
            let sqName = `${String.fromCharCode(fIdx + 97)}${rIdx + 1}`
            let squareDef = new BABYLON.SubMesh(materialIdx, 0, totalVertices, startIdx, gridIndices, boardTiles)
            // let sq = new BABYLON.Mesh(sqName, scene);
            let sq = boardTiles.clone(sqName) // could deconstruct mesh alternatively https://doc.babylonjs.com/toolsAndResources/utilities/Deconstruct_Mesh
            sq.subMeshes = [squareDef.clone(sq, sq)] 
            Object.assign(sq, {isPickable: true, id: sqName, name: sqName})
            let sqState = { sqName, coords: new BABYLON.Vector3(coords.x, 0, coords.y), mesh: sq, piece: null }
            return {...squares, [sqName]: sqState}
        },{})
        return {...ranks, ...rankSquares}
    },{});
    
    setTimeout(()=>{ boardTiles.dispose() }, 50) // todo: create board with prefab

    // console.log('squares', squares)
    return [board, squares]
}
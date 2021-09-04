
import { createMachine, actions, interpret, assign, send } from 'xstate';
import { pure } from 'xstate/lib/actions';
import { ClonePiece } from './utils/utils'; 
/*
** --------------------------------------------------------------------------
**  State managed with Xstate
** --------------------------------------------------------------------------
** 
**  A user begins in a moving.notSelected state. In any moving state, 
**  selected or not, the user may click to SELECT a square, which will  
**  transition the user to selected.dragging. If the user lets up on 
**  mouse click while dragging either a move attempt or transition to 
**  selected.notDragging occurs. In any selected state, dragging or not the
**  user may ATTEMPT_MOVE, which  will transition the user to a 
**  validatingMove state. Move validation can either ALLOW or DENY the move.
**  If allowed user will transition to a waiting state. Else move denied and
**  user will be transitioned back to the moving.notSelected state. The user
**  remains in waiting state until an OPP_MOVE is received, transitioning 
**  the user back to initial moving.notSelected state.
** 
*/
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
            promotedPieces: undefined,
            faded: undefined,
            captured: {white: 0, black: 0},
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
										actions: assign({ dragPos: (_, event) => event.value.pickedPoint })
									},
									'END_DRAG': 'notDragging' 
								}
							},
							notDragging: { }
						},
						on: {
                            'DESELECT': {
                                actions: assign({ fromSq: undefined }),
                                target: '#notSelected'
                            },
							'ATTEMPT_MOVE': {
								actions: [ 
									assign({ toSq: (_, event) => event.value }) 
								],
								target: '#validatingMove'
							}
						}
					}
				},
				on: {
					'SELECT': {
                        cond: (ctx, {value}) => value.piece, // todo & check if player's color/piece
						actions: [
							assign({ fromSq: (ctx, event) => event.value })
						],
						target: '.selected.dragging',
						// in: '#light.red.stop'
					}
				}
			},
            validatingMove: {
                id:'validatingMove',
                invoke:{
                    // needs to be a promise to handle promotion piece selection
                    src: (ctx, event) => async (trigger, onReceive) => {
                        let move = { from: ctx.fromSq.sqName, to: ctx.toSq.sqName }
                        let validMove = await game().checkMove(move)
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
                                fromSq: undefined, toSq: undefined, // todo flip prop order for readability, lastMove should still contain move
                            }) 
                        ],
                        target: '#waiting'
                    },
                    'DENY': {
                        actions: assign({ fromSq: undefined, toSq: undefined }),
                        // target: '.notSelected'
                        target: '#notSelected'
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
                actions: pure((ctx, event) => {
                    let types = [['squares', updateSquares], ['captured', updateCapture], ['faded', updateFaded]] 
                    let updates = event.value.reduce((changes, { type, ...change }) => {
                        return {...changes, [type]: [...(changes[type]||[]), change]}
                    }, {}) // aggregates list of changes into updates
                    let assignments = types.reduce((props, [type, factory]) =>{
                        return {
                            ...props, 
                            ...(updates[type] ? {[type]: factory(updates[type])}: {}), // if updates.type not empty add prop assigner to assignment
                        }
                    }, {}) // partially input updates to factory assigner for assignments
                    return assign(assignments)
                })
            }
        }
	})
    function updateSquares(squares) {
        return ctx => ({
            ...ctx['squares'],
            ...squares.reduce( (sqs, {name, piece}) => ({...sqs, [name]:{...ctx['squares'][name], piece}}), {})
        })
    } 
    function updateCapture(captured) {
        let [{ pieceColor, newCount, piece}] = captured
        return ctx => ({ ...ctx['captured'], [pieceColor]: newCount })
    }
    function updateFaded(faded) {
        let [{ piece }] = faded
        return ctx => {
            if (piece == ctx['faded']) return piece
            if (ctx['faded']) ctx['faded'].visibility = 1 // reset prev faded piece
            if (piece) piece.visibility = .35
            return piece || null
        }
    }
	return interpret(moveMachine)
		// .onTransition((state) => console.log('state changed', state))
		.start();
}

export default function Board(current, scene, canvas){
	let game = current.game,
	pieces = current.pieces,
	[board, squares] = createBoard(scene), // board var not used
	selectedHighlightLayer = new BABYLON.HighlightLayer("selected_sq", scene),
	moveService = setupStateMachine(game, squares);
	// $moveState = subscribeChanges(moveService)
	subscribeChanges(moveService)
	setupClickListeners(canvas)

    function subscribeChanges(moveService){
	    // cleanupState(){ subscription.unsubscribe()}
        return moveService.subscribe(state => {
            let { type, value } = state.event
            // console.log('ohh boy', {state})
            if (!state.changed) return
            // console.log('ohh boy!', {state})
            const eventHandlers = {
                'SELECT': selectSq,
                'DESELECT': deselectSq,
                'DRAG': dragPiece,
                'END_DRAG': endPieceDrag,
                // 'RESET': resetMove,
                // 'ATTEMPT_MOVE': attemptMove,
                'ALLOW': handleMove,
                'DENY': deselectSq,
                'OPP_MOVE': handleMove,
        	}
            eventHandlers[type]?.(value, state)
        });
    }
    //================================================================================
    // DOM event listeners
    //================================================================================
	function onPointerDown(evt) {
        // pointer down only selects a piece, never captures
	    const { send, state } = moveService
        if (evt.button !== 0) return;
        let pickInfo = pickWhere( mesh => mesh.isPickable); // pick square
        if (!pickInfo.hit) { // user clicked off board
            send({ type: "DESELECT"}) 
            return;
        } 
        let { squares } =  state.context
        let square = squares[pickInfo.pickedMesh.name]
        // if user is in review & trying to capture, dont select enemy piece
        // !only allow enemy piece selection in review
        let colorsMatch = getColor(square.piece) == getColor(state.context.fromSq?.piece)
        let isMove = state.matches('moving.selected') && !colorsMatch
        if (isMove){ 
            send({ type: "ATTEMPT_MOVE", value: square })
        }
        else if (state.matches('moving')) {
            send({ type: "SELECT", value: square })
        }
    }
    function onPointerUp(evt) {
	    const { send, state } = moveService
        if (evt.button == 2){ return; } // ignore right click
        if (!state.matches('moving.selected.dragging')){ return; } // ignore click release unless dragging 
        let pickInfo = pickWhere(mesh => mesh.isPickable)
        let { squares } =  state.context
        let square = squares[pickInfo.pickedMesh?.name];
        let sameSq = square === state.context.fromSq
        let pieceColorsMatch = getColor(square?.piece) == getColor(state.context.fromSq?.piece)
        if (sameSq || pieceColorsMatch || !pickInfo.hit){ // if !pickInfo.hit user dragged off board
            send({ type: "END_DRAG"}) // reposition dragged piece in center of starting sq
        }
        else if (!pieceColorsMatch){ 
            send({ type: "ATTEMPT_MOVE", value: square }) 
        }
    }
    function onPointerMove(evt) {
	    const { send, state } = moveService
        let {pickedPoint, pickedMesh} = pickWhere(mesh => mesh.isPickable)
        let square = state.context.squares[pickedMesh?.name]
        if (!state.matches("moving.selected.dragging")){ 
            if (square.piece) document.body.style.cursor = 'grab';
            else document.body.style.cursor = 'default';
            return
        } else document.body.style.cursor = 'grabbing';
        if (!pickedPoint) return;  // todo drag piece along sides of board if mouse is off board
        send({ type: "DRAG", value: {pickedPoint, hoveredSquare: square} })
    }
    function onRightPointerDown(evt) {
	    const { send, state } = moveService
        //   state.matches(["moving.selected.dragging","reviewing.selected.dragging"])
        if (state.matches("moving.selected.dragging")){ 
            send({ type: "END_DRAG" }) 
        }
        else { send({ type: "DESELECT" }) }
    }
    //================================================================================
    // State event listeners
    //================================================================================
    function selectSq(fromSq, state){
		// console.log('selected',{fromSq, history:state.history.context})
        // todo: change cursor back to grabbing
        if(state.history.context.fromSq){ // this could cause error after a move
            let {piece, coords} = state.history.context.fromSq
            changePosition(piece, coords) // reset prev piece
        }
        selectedHighlightLayer.removeAllMeshes();
        selectedHighlightLayer.addMesh(fromSq.mesh, BABYLON.Color3.Yellow()); // highlight
    }
    function dragPiece(event, state){
	    const { send } = moveService
        let { fromSq, faded } = state.context
        let { pickedPoint, hoveredSquare } = event
        let shouldFade = hoveredSquare.piece && (fromSq.piece != hoveredSquare.piece)
        let isFaded = faded || (fromSq.piece != hoveredSquare.piece)
        if (shouldFade) {
            send({type: 'UPDATE', value: [{ type: 'faded', piece: hoveredSquare.piece}]})
        } else if (isFaded){
            send({type: 'UPDATE', value: [{ type: 'faded', piece: null}]})
        }
        if (pickedPoint) changePosition(fromSq.piece, pickedPoint.clone())
        // if drag over another piece fade piece
        // else restore any faded pieces 
    }
    function deselectSq(_,state){
        // todo: change cursor back to grabbing
	    const { send } = moveService
        let { fromSq } = state.history.context
		if (fromSq) changePosition(fromSq.piece, fromSq.coords) 
        selectedHighlightLayer.removeAllMeshes();
        send({type: 'UPDATE', value: [{ type: 'faded', piece: null}]})
    }
    function endPieceDrag(_, state){
	    const { send } = moveService
        let { fromSq } = state.context
		changePosition(fromSq.piece, fromSq.coords)
        send({type: 'UPDATE', value: [{ type: 'faded', piece: null}]})
		// resetMove(fromSq, true)
    }
    function handleMove(move, state){
	    const { send } = moveService
        let { squares } =  state.context
        let { from, to, flags, promotion} = move
        let fromSq = squares[from]
        let toSq = squares[to]
        let changes = [
            { type: 'squares', name: to, piece: fromSq.piece},
            { type: 'squares', name: from, piece: null }
        ], castled;
        if (flags) { // can include both p & c at once
            if (flags.includes('p')) changes.push( ...addPromotionPiece(move))
            if (flags.includes('e')) changes.push( captureEnPassant(to))
            else if (flags.includes('c')) changes.push( positionCapturedPiece(toSq.piece))
            else if (castled = flags.match(/k|q/)) changes.push( ...positionCastledRook(castled[0], to))
        }
        send({type: 'UPDATE', value: changes})
        // console.log('handling move', {move,fromSq,toSq})
        changePosition(fromSq.piece, toSq.coords)
        selectedHighlightLayer.removeAllMeshes();
        // if (!this.inReview) this.addMoveForReview(gameMove)
        // toSq.piece = fromSq.piece
        // fromSq.piece.sqName = toSq.sqName
        // delete fromSq.piece
    }
    //================================================================================
    // Board Utilities
    //================================================================================
    function positionCapturedPiece(piece){
        // if(!this.inReview) this.capturedPieces[piece.id] = piece
        // piece.sqName = null
        let { captured } = moveService.state.context
        let pieceColor = getColor(piece)
        const processCapturedPiece = (pieceColor) =>  { //!
            let columnsCoords = [10, 11.5, 13]  // start columns horizontal: 2 units from board(8x8) & spread 1.5 units apart
            let count = captured[pieceColor] || 0
            let column = count / 8 | 0
            let offsetMultiplier = count % 8 
            let x = columnsCoords[column]
            let z = -6.5 + (1.3 * (offsetMultiplier)) // start rows vertical: -6.5 and move each piece up 1.3 units 
            let coords = pieceColor == 'white' ? [-1*x, 0, -1*z] : [x, 0, z] // invert coords for whites pieces
            return { nextPosition: new BABYLON.Vector3(...coords), newCount: ++count}
        } 
        let { nextPosition, newCount } = processCapturedPiece(pieceColor)
        changePosition(piece, nextPosition)
        return { type: 'captured', pieceColor, newCount, piece}
    }
    function captureEnPassant(moveTo) {
        let { squares } = moveService.state.context
        let rankOffSet = {6:5, 3:4} // possible ranks for captured piece, relative to capturing piece
        let file = moveTo.charAt(0)
        let rank = moveTo.charAt(1)
        let capturedPieceSq = file + rankOffSet[rank]
        return positionCapturedPiece(squares[capturedPieceSq].piece)
    }
    function positionCastledRook(side, kingSq){
        let { squares } =  moveService.state.context
        let rookPositions = { q: {from:'a', to:'d'}, k: {from:'h', to:'f'} } // possible files for castled rook
        let kingRank = kingSq.charAt(1)
        let getSqName = (order) => rookPositions[side][order] + kingRank
        let { from, to } = { from: getSqName('from'), to: getSqName('to') }
        let { piece } = squares[from]
        let toSq = squares[to]
        changePosition(piece, toSq.coords)
        return [
            { type: 'squares', name: from, piece: null},
            { type: 'squares', name: to, piece }
        ]
    }
    function addPromotionPiece({color, promotion, from, to}){
        let { squares } =  moveService.state.context
        let promotionPiece = ClonePiece({pieces, color, type: promotion})
        pieces()[promotionPiece.id] = promotionPiece
        let toSq = squares[to]
        let fromSq = squares[from]
        // fromSq.piece.setEnabled(false) 
        // this.promotedPawns.push[fromSq.piece]
        let pawn = fromSq.piece
        pawn.isVisible = false // hide pawn // todo setEnabled instead visible
        pawn.sqName = null
        // promotionPiece.sqName = to
        changePosition(promotionPiece, toSq.coords)
        return [
            { type: 'squares', name: from, piece: null },
            { type: 'squares', name: to, piece: promotionPiece} // will override pawn to promo sq update
        ]
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
    function changePosition(piece, newPos){
        // console.log('tf',{piece, newPos})
        let updatedPos = new BABYLON.Vector3(newPos.x, piece.position.y, newPos.z)
        if (!piece.position.equals(updatedPos)) piece.position = updatedPos
    }
    function getColor(piece){ //!
        if (!piece) return null
        return piece.name.match(/white|black/)[0]
    }
    function getClosestSq(fromPos){ //!
        // let { squares } =  moveService.state.context
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
            let closestSq = getClosestSq(piece.position) //! this has to be removed O(n2)
            let square = squares[closestSq.sqName]
            square.piece = piece
            // piece.sqName = closestSq.sqName
            // console.log('closestSq', squares[closestSq.sqName])
        })
        // console.log('mapped squares', squares)
    }
    function pickWhere (predicate) { return scene.pick(scene.pointerX, scene.pointerY, predicate) }
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
    return {
        mapPiecesToSquares,
        moveService
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
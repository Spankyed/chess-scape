
import { delay } from "nanodelay";
import { ClonePiece } from '../utils/utils'; 
import { setupMoveMachine } from './moveMachines';
// import { fromEvent } from "rxjs";
// import { throttleTime } from "rxjs/operators";
import { moveChangesToBoardMaps, createCaptureSq, getColor } from "../utils/utils"; 

export default function Board(current, scene, canvas){
	let game = current.game,
	pieces = current.pieces,
	[board, squares] = createBoard(scene), // board var not used
	selectedHighlightLayer = new BABYLON.HighlightLayer("selected_sq", scene),
	moveService = setupMoveMachine(current, game, squares, pieces);
	// $moveState = subscribeChanges(moveService)
	subscribeChanges(moveService)
	setupClickListeners(canvas)

    function subscribeChanges(moveService){
	    // cleanupState(){ subscription.unsubscribe()}
        return moveService.subscribe(state => {
            let { type, value } = state.event
            if (!state.changed) return
            // console.log('ohh boy!', {type, value, state})
            const eventHandlers = {
                'SELECT': selectSq,
                'DESELECT': deselectSq,
                'DRAG': dragPiece,
                'END_DRAG': endPieceDrag,
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
	function stateIs(check) {
        let { state } = moveService
        return state.matches(check) || state.matches('reviewing.' + check)  
    }
	function onPointerDown(evt) {
	    const { send, state } = moveService
        if (evt.button !== 0) return;
        let pickInfo = pickWhere( mesh => mesh.isPickable); // pick square
        if (!pickInfo.hit) { // user clicked off board
            send({ type: "DESELECT"}) 
            return;
        } 
        let { squares } =  state.context
        let square = squares[pickInfo.pickedMesh.name]
        // todo !only allow enemy piece selection in review
        let colorsMatch = getColor(square.piece) == getColor(state.context.fromSq?.piece)
        let isMove = stateIs('moving.selected') && !colorsMatch
        if (isMove){ 
            send({ type: "ATTEMPT_MOVE", value: square })
        }
        else if (stateIs('moving')) {
            send({ type: "SELECT", value: square })
        }
    }
    function onPointerUp(evt) {
	    const { send, state } = moveService
        if (evt.button == 2){ return; } // ignore right-click
        if (!stateIs('moving.selected.dragging')){ return; } // ignore click-release unless dragging 
        let board = pickWhere(mesh => mesh.isPickable)
        let { squares } =  state.context
        let square = squares[board.pickedMesh?.name];
        let sameSq = square === state.context.fromSq
        let pieceColorsMatch = getColor(square?.piece) == getColor(state.context.fromSq?.piece)
        if (sameSq || pieceColorsMatch || !board.hit){ 
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
        if (stateIs("moving.selected.dragging")) {
			document.body.style.cursor = "grabbing";
			if (!pickedPoint) return; // todo drag piece along sides of board if mouse is off board
			send({
				type: "DRAG",
				value: { boardPos: pickedPoint, hoveredSq: square },
			});
		} else if (stateIs("moving") && square?.piece) {
			document.body.style.cursor = "grab";
		} else {
			document.body.style.cursor = "default";
		}
    }
    function onRightPointerDown(evt) {
	    const { send } = moveService
        if (stateIs("moving.selected.dragging")){ 
            send({ type: "END_DRAG" }) 
        }
        else { send({ type: "DESELECT" }) }
    }
    //================================================================================
    // State event listeners
    //================================================================================
    function selectSq(fromSq, state){
        if (state.history.context.fromSq){ // reset prev piece
            let {piece, coords} = state.history.context.fromSq
            changePosition(piece, coords, true) 
        }
        selectedHighlightLayer.removeAllMeshes();
        selectedHighlightLayer.addMesh(fromSq.mesh, BABYLON.Color3.Yellow()); // highlight
    }
    function deselectSq(_, state){
	    const { send } = moveService
        let { fromSq } = state.history.context
		if (fromSq) changePosition(fromSq.piece, fromSq.coords, true) 
        selectedHighlightLayer.removeAllMeshes();
    }
    function dragPiece(_, state){
	    const { send } = moveService
        let { fromSq, faded, dragPos, hoveredSq } = state.context
        let shouldFade = hoveredSq?.piece && (fromSq?.piece != hoveredSq.piece)
        let isFaded = faded || (fromSq?.piece != hoveredSq?.piece)
        if (shouldFade) { // if drag over another piece fade piece
            send({type: 'UPDATE', value: [{ type: 'faded', piece: hoveredSq.piece}]})
        } else if (isFaded){ // else restore any faded pieces 
            send({type: 'UPDATE', value: [{ type: 'faded', piece: null}]})
        }
        if (dragPos) changePosition(fromSq.piece, dragPos.clone(), true)
    }
    function endPieceDrag(_, state){
	    // const { send } = moveService
        let { fromSq } = state.context
		changePosition(fromSq.piece, fromSq.coords, true)
    }
    function handleMove(move, state){
	    const { send } = moveService
        let { squares } =  state.context
        let { from, to, flags } = move
        let fromSq = squares[from]
        let toSq = squares[to]
        let changes = [
            { type: 'squares', name: to, piece: fromSq.piece},
            { type: 'squares', name: from, piece: null }
        ], castled;
        if (flags) { // p + c is only combination possible
            if (flags.includes('p')) changes.push( ...addPromotionPiece(move, state))
            if (flags.includes('e')) changes.push( ...captureEnPassant(to, state))
            else if (flags.includes('c')) changes.push( ...positionCapturedPiece(toSq.piece, state))
            else if (castled = flags.match(/k|q/)) changes.push( ...positionCastledRook(castled[0], to, state))
        }
        send({type: 'UPDATE', value: changes, addMove: !stateIs('reviewing') }) // add from/to to pos inside machine
        console.log('handled move',{move})
        selectedHighlightLayer.removeAllMeshes();
    }
    //================================================================================
    // Board Utilities
    //================================================================================
    function positionCapturedPiece(piece, state){
        let { captured } = state.context
        let color = getColor(piece)
        let { coords, newCount } = createCaptureSq(
			++(captured[color] || 0),
			color
		);
        changePosition(piece, coords, true)
        return [
            { type: 'squares', name: `cp_${newCount}_${color}`, coords, piece },
            { type: 'captured', color, newCount }
        ]
    }
    function captureEnPassant(moveTo, state) {
        let { squares } = state.context
        let rankOffSet = {6:5, 3:4} // possible ranks for captured piece, relative to capturing piece
        let file = moveTo.charAt(0)
        let rank = moveTo.charAt(1)
        let capturedPieceSq = file + rankOffSet[rank]
        return positionCapturedPiece(squares[capturedPieceSq].piece)
    }
    function positionCastledRook(side, kingSq, state){
        let { squares } =  state.context
        let rookPositions = { q: {from:'a', to:'d'}, k: {from:'h', to:'f'} } // possible files for castled rook
        let kingRank = kingSq.charAt(1)
        let constructSqName = (order) => rookPositions[side][order] + kingRank
        let { from, to } = { from: constructSqName('from'), to: constructSqName('to') }
        let { piece } = squares[from]
        let toSq = squares[to]
        changePosition(piece, toSq.coords)
        return [
            { type: 'squares', name: from, piece: null},
            { type: 'squares', name: to, piece }
        ]
    }
    function addPromotionPiece({color, promotion, from, to}, state){
        let { squares } =  state.context
        let promotionPiece = ClonePiece({pieces, color, type: promotion})
        let toSq = squares[to]
        let fromSq = squares[from]
        // fromSq.piece.setEnabled(false) 
        // this.promotedPawns.push[fromSq.piece]
        let pawn = fromSq.piece
        pawn.setEnabled(false) // hide pawn 
        changePosition(promotionPiece, toSq.coords, true)
        return [
            { type: 'squares', name: from, piece: null },
            { type: 'squares', name: to, piece: promotionPiece }, // overrides pawn to promo sq update in handleMove
        ]
    }
    function changePosition(piece, newPos, dontSlide){
	    const { send } = moveService
        send({type: 'POSITION', value: { piece, newPos, ...(dontSlide ? {dontSlide} : {})} })
    }

    function getClosestSq(fromPos){ //! highly inefficient when used to mapPieces
        // let { squares } =  moveService.state.context
        if (!fromPos) return
        let closest = { sqName: '', dist: 999 }; 
        for (const sqName in squares) {
            let dist = BABYLON.Vector3.Distance(fromPos, squares[sqName].coords)
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
            // console.log('closestSq', squares[closestSq.sqName])
        })
        // console.log('mapped squares', squares)
    }
    function pickWhere (predicate) { return scene.pick(scene.pointerX, scene.pointerY, predicate) }
    function setupClickListeners(canvas) {
        canvas.addEventListener("pointerdown", onPointerDown, false);
        canvas.addEventListener("contextmenu", onRightPointerDown, false);
        canvas.addEventListener("pointerup", onPointerUp, false);
        canvas.addEventListener("pointermove", onPointerMove, false);
        // let pointerMove$ = fromEvent(canvas, "pointermove")
		// 	.pipe(throttleTime(1))
		// 	.subscribe(onPointerMove);
        scene.onDispose = () => {
            canvas.removeEventListener("pointerdown", onPointerDown);
            canvas.removeEventListener("contextmenu", onRightPointerDown);
            canvas.removeEventListener("pointerup", onPointerUp);
            canvas.removeEventListener("pointermove", onPointerMove);
            // pointerMove$.unsubscribe()
        }
    };
    function syncBoard({moves, lastMove}) {
        if (moves.length < 1) return
	    const { send } = moveService;
		send({ type: "SYNC", value: { moves: moveChangesToBoardMaps(moves), lastMove: lastMove.info } });
	}
    function resetBoard(){
        const { send } = moveService
        send({ type: "RESET_BOARD" });
    }
    return {
		mapPiecesToSquares,
		moveService,
		resetBoard,
		syncBoard,
	};
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
            let startIdx = fIdx * gridIndices + (rIdx * 48); // slide over 48 indices every rank for subMesh def
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
    
    delay(50).then(_ => boardTiles.dispose())// todo: create board using prefab

    // console.log('squares', squares)

    // squares = Object.entries(squares).reduce((sqs, [sqName, { piece, coords }]) => ({...sqs, [sqName]: {piece, coords, sqName}}),{})

    return [board, squares]
}
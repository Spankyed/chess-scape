
import { createMachine, interpret, assign, send } from 'xstate';
import { pure } from 'xstate/lib/actions';
import { SerializeBoard, DeserializeBoard  } from '../utils/utils'; 

/*
** --------------------------------------------------------------------------
**  State managed with Xstate statecharts
** --------------------------------------------------------------------------
**  _______Simplified Overview (does not include review states)_______
**  A user begins in the moving.notSelected state. In any moving state, 
**  selected or not, the user may click to SELECT a square, which will  
**  transition the user to selected.dragging. If the user lets up on 
**  mouse click while dragging either a move attempt or transition to 
**  selected.notDragging occurs. In any selected state, dragging or not the
**  user may ATTEMPT_MOVE, which will transition the user to the 
**  validatingMove state. Move validation can either ALLOW or DENY the move.
**  If allowed user will transition to a waiting state. Else move denied and
**  user will be transitioned back to the moving.notSelected state. The user
**  remains in waiting state until an OPP_MOVE event is received, transitioning 
**  the user back to the initial moving.notSelected state.
** 
*/

function setupMachine(current, game, squares, pieces){
	const moveMachine = createMachine({
		id: 'move_machine',
		initial: 'moving',
		context: {
            squares: squares,
			currPlayer: 'white',
			colorToMove: 'white',
			canMove: true, // initially set t/f depending on player color
			toSq: undefined,
			fromSq: undefined,
            hoveredSq: undefined,
            dragPos: undefined,
			lastMove: undefined,
            promotedPieces: undefined,
            faded: undefined,
            captured: {white: 0, black: 0},
            moves: []
		},
		states: {
			moving: {
                id: 'moving',
				initial: 'notSelected',
				states: {
					notSelected: { 
						id: 'notSelected',
                        // entry:{} // consider deselect, reset move  
					},
					selected: {
						initial: 'dragging',
						states: {
							dragging: {
								on: {
									'DRAG': {
										actions: assign({ 
                                            dragPos: (_, { value }) => value.boardPos,
                                            hoveredSq: (_, { value }) => value.hoveredSq
                                         })
									},
									'END_DRAG': {
                                        target:'notDragging', 
                                        actions: send({type: 'UPDATE', value: [{ type: 'faded', piece: null}]})
                                    }
								}
							},
							notDragging: { }
						},
						on: {
							'ATTEMPT_MOVE': {
								actions: assign({ toSq: (_, event) => event.value }),
								target: '#validatingMove'
							}
						}
					}
				},
				on: {
                    'DESELECT': {
                        actions: send({type: 'RESET'}),
                        target: '.notSelected'
                    },
					'SELECT': {
                        cond: (_, {value}) => !!value.piece, // todo also check if player's color/piece
						actions: assign({ fromSq: (_, {value}) => value }),
						target: '.selected.dragging',
						// in: '#light.red.stop'
					}
				}
			},
            validatingMove: {
                id:'validatingMove',
                invoke: {
                    src: ctx => async (sendBack) => {
                        let move = { from: ctx.fromSq.sqName, to: ctx.toSq.sqName }
                        let validMove = await game().checkMove(move)
                        sendBack({type: !!validMove ? 'ALLOW' : 'DENY', value: validMove })
                    },
                    onError: '#moving.selected'
                },
                on: {
                    'ALLOW': {
                        // todo: indicate square of prev move (change tile material color)
                        actions: [
                            assign({ 
                                canMove: false,
                                // fromSq: undefined, toSq: undefined, 
                                lastMove: (_, {value}) => value,
                            }),
                            send({type: 'RESET'})
                        ],
                        target: '#waiting'
                    },
                    'DENY': {
                        actions: send({type: 'RESET'}),
                        target: '#moving.notSelected'
                    }
                }
            },
			waiting: {
				id: 'waiting',
				on: { }
			},
            // ___________________________________________________________________________________________________________________
            reviewing: {
                id: 'reviewing',
                initial: 'moving',
                invoke: {
                    src: ({moves, squares}, {value}) => sendBack =>{
                        game().reviewEngine.load(moves[value?.id]?.fen),
                        sendBack({
                            type: 'SET_BOARD', 
                            value:{ ...DeserializeBoard(moves[value?.id]?.board, squares) }
                        })
                        return
                    }
                },
                entry: send({type: 'DESELECT'}),
                exit: [
                    // _ => current.uiActions.sidePanel.moves.endReview(),
                    send({type: 'DESELECT'}),
                    send(({moves, squares}) => ({
                        type: 'SET_BOARD',
                        value: { ...DeserializeBoard(moves[moves.length-1]?.board, squares) }
                    }))
                ],
                states: {
                    moving: {
                        id: 'r_moving',
                        initial: 'notSelected',
                        states: {
                            notSelected: { },
                            selected: {
                                initial: 'dragging',
                                states: {
                                    dragging: {
                                        on: {
                                            'DRAG': {
                                                actions: assign({ 
                                                    dragPos: (_, { value }) => value.boardPos,
                                                    hoveredSq: (_, { value }) => value.hoveredSq
                                                 })
                                            },
                                            'END_DRAG': {
                                                target: 'notDragging',
                                                actions: send({type: 'UPDATE', value: [{ type: 'faded', piece: null}]})
                                            } 
                                        }
                                    },
                                    notDragging: { }
                                },
                                on: {
                                    'ATTEMPT_MOVE': {
                                        actions: assign({ toSq: (_, event) => event.value }),
                                        target: '#reviewing.validatingMove'
                                    }
                                }
                            }
                        },
                        on: { 
                            'DESELECT': {
                                actions: send({type: 'RESET'}),
                                target: '.notSelected'
                            },
                            'SELECT': {
                                cond: (ctx, {value}) => !!value.piece, // todo also check if player's color/piece
                                actions: assign({ fromSq: (ctx, {value}) => value }),
                                target: '.selected.dragging',
                            }
                        }
                    },
                    validatingMove: {
                        id:'r_validatingMove',
                        invoke:{
                            src: ctx => async (sendBack) => {
                                let move = { from: ctx.fromSq.sqName, to: ctx.toSq.sqName }
                                let validMove = await game().checkMove(move)
                                sendBack({type: !!validMove ? 'ALLOW' : 'DENY', value: validMove })
                            },
                            onError: '#moving.selected'
                        },
                        on: {
                            'ALLOW': {
                                // todo: indicate square of prev move (change tile material color)
                                actions: [
                                    assign({ 
                                        // fromSq: undefined, toSq: undefined, 
                                        lastMove: (_, {value}) => value,
                                    }),
                                    send({type: 'RESET'})
                                ],
                                target: '#reviewing.moving.notSelected'
                            },
                            'DENY': {
                                actions: send({type: 'RESET'}),
                                target: '#reviewing.moving.notSelected'
                            }
                        }
                    },
                    // finished: { type: 'final' }
                }
			},
		},
        // ___________________________________________________________________________________________________________________
        on:{
            'RESET': {
                actions: [
                    assign({ fromSq: undefined, toSq: undefined }),
                    send({type: 'UPDATE', value: [{ type: 'faded', piece: null}]}),
                ]
            },
            'OPP_MOVE': { // todo test if user in review selections are reset
                actions: [
                    assign({ 
                        canMove: true,
                        lastMove: (_, {value}) => value
                    })
                ],
                target: 'moving'
			},
            'UPDATE': {
                actions: [
                    pure((_, {value}) => {
                        let types = [
                            ['squares', updateSquares], 
                            ['captured', updateCaptured], 
                            ['faded', updateFaded]
                        ] 
                        let updates = value.reduce((changes, { type, ...change }) => {
                            return {...changes, [type]: [...(changes[type]||[]), change]}
                        }, {}) // sort list of changes into updates
                        let assignments = types.reduce((props, [type, factory]) =>{
                            return {
                                ...props, 
                                ...(updates[type] ? {[type]: factory(updates[type])}: {}), // if updates.type not empty add prop assigner to assignment
                            }
                        }, {}) // partially input updates to designated assigner factoryFn for assignments
                        return assign(assignments)
                    }),
                    pure((_, {addMove})=>{
                        if (!addMove) return
                        return assign({
                            moves: (ctx, {value}) => ([ 
                                ...ctx.moves,
                                {   
                                    board: SerializeBoard(ctx.squares, pieces, ctx.captured), 
                                    fen: game().engine.fen()
                                }
                            ])
                        })
                    }),
                    (ctx, {addMove})=>{
                        if (!addMove) return
                        let { piece, san, color} = ctx.lastMove
                        current.uiActions.sidePanel.moves.addMove({ piece, san, id: ctx.moves.length-1, color})
                    }
                ]
            },
            'POSITION': {
                actions: (_, {value}) => positionPieces(value)
            },
            'REVIEW': {
                target: '#reviewing',
            },
            'END_REVIEW': [
                {  target: '.moving', cond: ctx => ctx.canMove},
                {  target: '.waiting', cond: ctx => !ctx.canMove}
            ],
            'SET_BOARD': {
                actions: [
                    updatePieces(pieces),
                    assign({
                        squares: updateSquares(), // updateSquares() defaults to ev.val.sqChanges   
                        captured: (_,{value}) => value.captured
                    }), 
                    ({squares}) => positionPieces(Object.entries(squares).map(([_,{ piece, coords }]) => ({
                        piece, newPos: coords
                    })))
                ]
            }
        }
	})

	return interpret(moveMachine)
    // .onTransition((state) => console.log('state changed', state))
    .start();
}
function updateSquares(changes) {
    return (ctx, { value }) => ({
        ...ctx['squares'], // some/all these prev squares will be overwritten
        ...(changes||value.sqChanges) // defaults to ev.val.sqChanges for SET_BOARD
        .reduce( (sqs, {type, name, piece, ...square}) => ({
            ...sqs, 
            [name]: {
                ...(ctx['squares'][name]||square), // get sq from ctx or create new sq for captured pieces
                piece
            }
        }), {})
    })
} 
function updatePieces(pieces) {
    return (_, { value }) => {
        Object.entries(pieces()).forEach( ([id, piece]) =>{
            if (!value.piecesMap[id]) {
                piece.setEnabled(false)
                return
            }
            let isEnabled = value.piecesMap[id].isEnabled
            if (piece.isEnabled != isEnabled) piece.setEnabled(isEnabled)
        })
    }
}
function updateCaptured(change) {
    let [{ pieceColor, newCount }] = change
    return ctx => ({ ...ctx['captured'], [pieceColor]: newCount })
}
function updateFaded(change) {
    let [{ piece }] = change
    return ctx => {
        if (piece == ctx['faded']) return piece // piece already faded
        if (ctx['faded']) ctx['faded'].visibility = 1 // reset prev faded piece
        if (piece) piece.visibility = .35 // fade piece
        return piece || null
    }
}
function positionPieces(pieces) {
    if (!(pieces instanceof Array)) pieces = [pieces]
    pieces.forEach(({ piece, newPos }) => {
        if (piece && !piece.position.equals(newPos)){
            let updatedPos = new BABYLON.Vector3(newPos.x, piece.position.y, newPos.z)
            piece.position = updatedPos
        }
    })
}

export {
    setupMachine
}

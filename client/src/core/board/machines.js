
import { createMachine, interpret, assign, send, sendParent, spawn, sendUpdate } from 'xstate';
import { pure, log } from 'xstate/lib/actions';
import { SerializeBoard, DeserializeBoard  } from '../utils/utils'; 

/*
** --------------------------------------------------------------------------
**  State managed with Xstate statecharts
** --------------------------------------------------------------------------
**  ___Simplified Overview (does not include review machine)___
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
			canMove: true,
			toSq: undefined,
			fromSq: undefined,
            hoveredSq: undefined,
            dragPos: undefined,
			lastMove: undefined,
            promotedPieces: undefined,
            faded: undefined,
            captured: {white: 0, black: 0},
            moves: []
			// inReview: false,
		},
		states: {
			moving: {
                id: 'moving',
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
                            'DESELECT': {
                                actions: [
                                    assign({ fromSq: undefined }),
                                    send({type: 'UPDATE', value: [{ type: 'faded', piece: null}]})
                                ],
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
                        cond: (ctx, {value}) => !!value.piece, // todo also check if player's color/piece
						actions: [
                            // (_,ev) => console.log('sel',ev.value),
							assign({ fromSq: (ctx, {value}) => value })
						],
						target: '.selected.dragging',
						// in: '#light.red.stop'
					}
				}
			},
            validatingMove: {
                id:'validatingMove',
                invoke:{
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
                                canMove: false,
                                fromSq: undefined, toSq: undefined, 
                                lastMove: (ctx, {value}) => value,
                            }),
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
				on: { }
			},
            reviewing: {
                id: 'reviewing',
                // entry: assign({
                //     reviewRef: (ctx, {value}) => spawn(setupReviewMachine(
                //         DeserializeBoard(ctx.moves[value.id].squares, pieces, ctx.squares),
                //         game, ctx.squares
                //     ),  { name: 'reviews', autoForward: true })
                // }),
                invoke:{
                    id: 'review_machine',
                    autoForward: true, // forward events received by parent machine
                    sync: true,
                    src: (ctx, {value}) => {
                        return setupReviewMachine(
                            DeserializeBoard(ctx.moves[value.id].squares, pieces, ctx.squares),
                            game, ctx.squares
                        )
                    },
                    onDone: {
                        actions: (ctx, event)=>{
                            console.log('bichhhh we done reviewing!!!!',moveMachine.state.history)
                        }
                    }
                },
                exit: send(ctx => ({
                    type: 'SET_BOARD',
                    value: { squares: DeserializeBoard(ctx.moves[ctx.moves.length-1].squares, pieces) }
                })),
				on: {
                    // '': { actions: assign({ fromSq: undefined, toSq: undefined }) }, infinite loop
				}
			},
		},
        on:{

            'OPP_MOVE': {
                actions: [
                    assign({ 
                        canMove: true,
                        lastMove: (_, {value}) => value,
                        moves: (ctx, {value}) => ([ 
                            ...ctx.moves,
                            {   
                                squares: SerializeBoard(ctx.squares, value), //fen: game().engine.fen(),
                                captured: ctx.captured
                            }
                        ]),
                    }),
                ],
                target: 'moving'
			},
            'UPDATE': {
                actions: [
                    pure((ctx, {value}) => {
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
                    pure((ctx, {add})=>{
                        if (!add) return
                        return assign({
                            moves: (ctx, {value}) => ([ 
                                ...ctx.moves,
                                {   
                                    squares: SerializeBoard(ctx.squares, value), //fen: game().engine.fen(),
                                    captured: ctx.captured
                                }
                            ])
                        })
                    }),
                    (ctx, {add})=>{
                        if (!add) return
                        let { piece, san, color} = ctx.lastMove
                        current.uiActions.sidePanel.moves.addMove({ piece, san, id: ctx.moves.length-1, color})
                    }
                ]
            },
            'POSITION':{
                actions: (_, {value}) => {
                    if(!(value instanceof Array)) value = [value]
                    value.forEach(({ piece, newPos }) => {
                        if (piece && !piece.position.equals(newPos)){
                            let updatedPos = new BABYLON.Vector3(newPos.x, piece.position.y, newPos.z)
                            piece.position = updatedPos
                        }
                    })
                }
            },
            'REVIEW': {
                target: '#reviewing',
            },
            'END_REVIEW': [
                {  target: '.moving', cond: ctx => ctx.canMove},
                {  target: '.waiting', cond: ctx => !ctx.canMove}
            ],
            'SET_BOARD':{
                // todo removedPromotionPieces
                actions: [
                    // (ctx, {value})=>console.log('setting',value),
                    assign({squares: updateSquares()}), // updateSquares() defaults to ev.val.squares
                    // send((ctx, {value}) =>({ type: 'UPDATE', value: value.squares})),
                    send(ctx => ({
                        type: 'POSITION', 
                        value: Object.entries(ctx.squares).map(([_,{ piece, coords }]) => ({piece, newPos: coords}))
                    }))
                ],
                // target: 'moving'
            },
        }
	})

	return interpret(moveMachine)
    // .onTransition((state) => console.log('state changed', state))
    .start();
}
function updateSquares(squares) {
    return (ctx,{ value }) => ({
        ...ctx['squares'],
        ...(squares||value.squares).reduce( (sqs, {name, piece}) => ({...sqs, [name]:{...ctx['squares'][name], piece}}), {})
    })
} 
function updateCaptured(captured) {
    let [{ pieceColor, newCount, piece}] = captured
    return ctx => ({ ...ctx['captured'], [pieceColor]: newCount })
}
function updateFaded(faded) {
    let [{ piece }] = faded
    return ctx => {
        if (piece == ctx['faded']) return piece // piece already faded
        if (ctx['faded']) ctx['faded'].visibility = 1 // reset prev faded piece
        if (piece) piece.visibility = .35 // fade piece
        return piece || null
    }
}

function setupReviewMachine(initUpdates, game, squares){
	const reviewMachine = createMachine({
		id: 'review_states',
		initial: 'setup',
		context: {
            squares: squares,
			// currPlayer: 'white',
			colorToMove: 'white',
			fromSq: undefined,
			toSq: undefined,
			lastMove: undefined,
			initUpdates: initUpdates,
            promotedPieces: undefined,
            faded: undefined,
            captured: {white: 0, black: 0},
		},
		states: {
            setup: {
                always: {
                    target: 'moving', 
                    actions: [
                        send(ctx => ({type: 'SET_BOARD', value:{ squares: ctx.initUpdates }})),
                        send({type: 'DESELECT'}),
                        // sendUpdate()
                        //todo set fen for review engine
                    ]
                }
            },
			moving: {
                id: 'moving',
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
										actions: [
                                            assign({ dragPos: (_, event) => event.value.boardPos }),
                                            // sendUpdate()
                                        ]
									},
									'END_DRAG': 'notDragging' 
								}
							},
							notDragging: { }
						},
						on: {
							'ATTEMPT_MOVE': {
								actions: [ 
									assign({ toSq: (_, event) => event.value }),
                                    // sendUpdate() 
								],
								target: '#validatingMove'
							}
						}
					}
				},
				on: {
					'SELECT': {
                        cond: (ctx, {value}) => !!value.piece, // todo also check if player's color/piece
						actions: [
							assign({ fromSq: (ctx, {value}) => value }),
                            // sendUpdate()
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
                entry: [

                ],
                // entry:{},
                on: {
                    'ALLOW': {
                        // todo: indicate square of prev move (change tile material color)
                        actions: [ 
                            _=>console.log('fkme'),
                            assign({ 
                                fromSq: undefined, toSq: undefined, 
                                lastMove: (ctx, event) => ({
                                    from: ctx.fromSq.sqName,
                                    to: event.value.to
                                }),
                            }),
                            sendUpdate() 
                        ],
                        // target: '#moving.notSelected'
                        target: '#notSelected'
                    },
                    'DENY': {
                        actions: [
                            assign({ fromSq: undefined, toSq: undefined }),
                            // sendUpdate()
                        ],
                        // target: '.notSelected'
                        target: '#notSelected'
                    }
                }
            },
            // finished: { type: 'final' }
		},
        on:{ 
            'DESELECT': {
                actions: [
                    _=>console.log('fkme2'),
                    // (ctx, {value})=>console.log('deselecting'),
                    assign({ fromSq: undefined }),
                    send({type: 'UPDATE', value: [{ type: 'faded', piece: null}]}),
                    sendUpdate()
                ],
                target: '#notSelected'
            },
            'SET_BOARD':{
                // todo removedPromotionPieces
                actions: [
                    // (ctx, {value})=>console.log('setting',value),
                    assign({squares: updateSquares()}), // updateSquares() defaults to ev.val.squares
                    // send((ctx, {value}) =>({ type: 'UPDATE', value: value.squares})),
                    sendParent(ctx => ({
                        type: 'POSITION', 
                        value: Object.entries(ctx.squares).map(([_,{ piece, coords }]) => ({piece, newPos: coords}))
                    })),
                    // sendUpdate()
                ],
                // target: 'moving'
            },
        }
	})
    return reviewMachine
}
export {
    setupMachine
}

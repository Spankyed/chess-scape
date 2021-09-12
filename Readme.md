# Chess-Scape

3D chess game developed as a demo of the work and research I've done around the BabylonJS game engine over the last few years.

The vision of the project is to allow chess loving individuals to play and watch matches, while chatting and sharing interesting media. 

The project is still in development with plans to add features as I see fit.

Support for Internet Explorer 9 and up.

## Tech 
- Node & fastify for API server 
- Websockets for bidirectional client/server communication
- XState for state management
- Hyperapp front-end framework
- BabylonJS 3D game engine
- ChessJS chess engine
- RxJS for async event handling
- TailwindCSS for rapid UI prototyping
- BSON to handle complex data (JSON/binary) 
- Dicebear for user image generation

## Notable Features
- Multiplayer
- Public/Private matches
- Review game moves
- Game room chat
- Share music files & Youtube videos
- Mobile friendly

## State Chart

Xstate statechart visualization courtesy of stately.ai.
This is a simplified version of the [actual](https://stately.ai/viz/1635ac15-24da-4e8f-9180-52e45d65040f) FSM statechart that is used to manage the chess board state. It does not include 'reviewing-moves' states.

![Simple Chess Moves Statechart](https://i.ibb.co/1f5xBk5/chess-moves-machine.png)

**Overview**: A user begins in the moving.notSelected state. In any moving state, selected or not, the user may click to SELECT a square, which will transition the user to selected.dragging. If the user lets up on mouse click while dragging either a move attempt or transition to selected.notDragging occurs. In any selected state, dragging or not the user may ATTEMPT_MOVE, which will transition the user to the validatingMove state. Move validation can either ALLOW or DENY the move. If allowed user will transition to a waiting state. Else move denied and user will be transitioned back to the moving.notSelected state. The user remains in waiting state until an OPP_MOVE event is received, transitioning the user back to the initial moving.notSelected state.
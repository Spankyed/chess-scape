# Chess-Scape

3D chess game developed to demo some the work and research I've done around the BabylonJS game engine over the last few years.

Chess loving individuals may challenge other players or myself to a match. Matches are hosted in rooms where players and spectators can also chat and share interesting media with one another. 

The project is actively in development with plans to add features as I see fit.

Support for Internet Explore 9+ and some mobile devices.

## Tech 
- Serverless Framework
- AWS Lambda, API Gateway, DynamoDB, S3
- Websockets for bidirectional client/server communication
- XState for state management
- Hyperapp front-end framework
- BabylonJS 3D game engine
- ChessJS chess engine
- TailwindCSS for rapid UI prototyping 
- Dicebear for user image generation
- Swagger for API documentation

## Notable Features
- Review game moves
- Multiplayer
- Public/Private matches
- Game room chat
- Share music files & Youtube videos
- Mobile friendly

## State Chart
State machine visualization courtesy of the awesome work done by the stately.ai team.
You can also checkout and interact with the [actual](https://stately.ai/viz/1635ac15-24da-4e8f-9180-52e45d65040f) FSM statechart that is used to manage the chess board state. For simplicity, the statechart image below does not include the "Reviewing" moves state.

![Chess Moves Statechart](https://i.ibb.co/1f5xBk5/chess-moves-machine.png)

**Overview**: A user begins in the moving.notSelected state. In any moving state, selected or not, the user may click to SELECT a square, which will transition the user to selected.dragging. If the user lets up on mouse click while dragging either a move attempt or transition to selected.notDragging occurs. In any selected state, dragging or not the user may ATTEMPT_MOVE, which will transition the user to the validatingMove state. Move validation can either ALLOW or DENY the move. If allowed user will transition to a waiting state. Else move denied and user will be transitioned back to the moving.notSelected state. The user remains in waiting state until an OPP_MOVE event is received, transitioning the user back to the initial moving.notSelected state.
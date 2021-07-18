import { h } from 'hyperapp';
import Loader from './loader/loader'; 
import Controls from './controls/Controls'; 
import Scene from './scene.js';
import Chat from './sidePanel/Chat'; 

const controls = Controls()
const chat = Chat()

// todo: if in game and websocket disconnects, reconnect 
// todo: if leave game remove clientId from game.clients 
export default initial => ({
	state: { 
		controls: controls.state,
		chat: chat.state,
		isLoading: true,
		isChatting: false,
		gameOver: false,
	},

	actions: { 
		controls: controls.actions,
		chat: chat.actions,
		showLoader: () => () => ({isLoading: true}),
		toggleChat: (ev) => (state) => ({isChatting: !state.isChatting}),
		hideLoader: () => () => ({isLoading: false}),
		endGame: () => () => ({gameOver: true}),
	},

	view: (state, actions) => ({gameId, leaveGame}) => {
		const ControlsView = controls.view(state.controls, actions.controls)
		const ChatView = chat.view(state.chat, actions.chat)
		/* todo: on destroy, breakdown websocket and game */
		return ( 
			<div class="h-full flex">
				<Loader isLoading={state.isLoading}/>

				<div class="relative flex-grow">
					<ControlsView isLoading={state.isLoading} gameOver={state.gameOver} toggleChat={actions.toggleChat}/>
					<Scene gameId={gameId} state={state} actions={actions}/> 
				</div>

				<ChatView isChatting={state.isChatting} state={state} actions={actions}/> 

			</div>

		)
	}
})

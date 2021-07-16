import { h } from 'hyperapp';
// import Chat from './Chat'; 
import Loader from './loader/loader'; 
import Controls from './controls/Controls'; 
import Scene from './scene.js';

const controls = Controls()

// todo: if in game and websocket disconnects, reconnect 
// todo: if leave game remove clientId from game.clients 
export default initial => ({
	state: { 
		controls: controls.state,
		isLoading: true,
		isChatting: false
	},

	actions: { 
		controls: controls.actions,
		showLoader: () => () => ({isLoading: true}),
		toggleChat: (ev) => (state) => ({isChatting: !state.isChatting}),
		hideLoader: () => () => ({isLoading: false})
	},

	view: (state, actions) => ({gameId, leaveGame}) => {
		const ControlsView = controls.view(state.controls, actions.controls)
		/* todo: on destroy, breakdown websocket and game */
		return ( 
			<div class="h-full">
				<Loader isLoading={state.isLoading}/>
				<ControlsView isLoading={state.isLoading} toggleChat={actions.toggleChat}/>
				<Scene gameId={gameId} state={state} actions={actions}/> 
				{ state.isChatting && 
					<Chat state={state} actions={actions}/> 
				}
			</div>

		)
	}
})

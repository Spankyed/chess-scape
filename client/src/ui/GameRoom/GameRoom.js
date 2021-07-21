import { h } from 'hyperapp';
import Loader from './loader/loader'; 
import Controls from './controls/Controls'; 
import Scene from './scene.js';
import SidePanel from './sidePanel/sidePanel'; 

const controls = Controls()
const sidePanel = SidePanel()

// todo: if in game and websocket disconnects, reconnect 
// todo: if leave game remove clientId from game.clients 
export default initial => ({
	state: { 
		controls: controls.state,
		sidePanel: sidePanel.state,
		isLoading: true,
		sidePanelOpen: false,
		gameOver: false,
	},

	actions: { 
		controls: controls.actions,
		sidePanel: sidePanel.actions,
		showLoader: () => () => ({isLoading: true}),
		toggleSidePanel: (tab, isOpen) => ({sidePanel}) => {
			let newState = { sidePanel: {...sidePanel, isVisible:  isOpen || !sidePanel.isVisible}}
			if (tab) newState.sidePanel.currTab = tab
			return newState
		},
		hideLoader: () => () => ({isLoading: false}),
		endGame: () => () => ({gameOver: true}),
	},

	view: (state, actions) => ({gameId, leaveGame}) => {
		const ControlsView = controls.view(state.controls, actions.controls)
		const SidePanelView = sidePanel.view(state.sidePanel, actions.sidePanel)
		/* todo: on destroy, breakdown websocket and game */
		return ( 
			<div class="h-full flex">
				<Loader isLoading={state.isLoading}/>

				<div class="relative flex-grow">
					<ControlsView isLoading={state.isLoading} gameOver={state.gameOver} toggleSidePanel={actions.toggleSidePanel}/>
					<Scene gameId={gameId} state={state} actions={actions} /> 
				</div>

				<SidePanelView/> 
			</div>
		)
	}
})

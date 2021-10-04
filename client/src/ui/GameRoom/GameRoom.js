import { h } from 'hyperapp';
import Game from './game.js';
import Loader from './loader/loader'; 
import Controls from './controls/Controls'; 
import SidePanel from './sidePanel/sidePanel'; 
import Alert from '../Shared/Alert';

const controls = Controls()
const sidePanel = SidePanel()
const alert = Alert()

// todo: alert users & handle reconnect if player disconnects in game,  
// todo: when user leaves game remove clientID from game.clients 
export default initial => ({
	state: { 
		controls: controls.state,
		sidePanel: sidePanel.state,
		alert: alert.state,
		isLoading: true,
		sidePanelOpen: false,
		gameOver: false,
	},
	actions: { 
		controls: controls.actions,
		sidePanel: sidePanel.actions,
		alert: alert.actions,
		showLoader: () => () => ({isLoading: true}),
		toggleSidePanel: (tab, isOpen) => ({sidePanel}) => {
			let newState = { sidePanel: {...sidePanel, isVisible:  isOpen || !sidePanel.isVisible}}
			if (tab) newState.sidePanel.currTab = tab
			return newState
		},
		hideLoader: () => () => ({isLoading: false}),
		endGame: () => () => ({gameOver: true}),
	},
	view: (state, actions) => ({roomID, leaveGame}) => {
		const ControlsView = controls.view(state.controls, actions.controls)
		const SidePanelView = sidePanel.view(state.sidePanel, actions.sidePanel)
		const AlertView = alert.view(state.alert, actions.alert)
		/* todo: on destroy, breakdown websocket and game */
		const leave = () => {
			actions.showLoader();
			leaveGame()
		}
		return (
			<div class="h-full flex">
				<Loader isLoading={state.isLoading} alert={actions.alert} />

				<div class="relative flex-grow">
					<ControlsView
						roomID={roomID}
						isLoading={state.isLoading}
						gameOver={state.gameOver}
						leaveGame={leave}
						toggleSidePanel={actions.toggleSidePanel}
					/>
					<Game {...{ roomID, actions, state }} />
					<AlertView />
				</div>

				<SidePanelView roomID={roomID} alert={actions.alert} />
			</div>
		);
	}
})

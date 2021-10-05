import { h } from 'hyperapp';
import Game from './game.js';
import Loader from './loader/loader'; 
import Controls from './controls/Controls'; 
import SidePanel from './sidePanel/sidePanel'; 
import Alert from '../Shared/Alert';
import Api from "../../api/Api";

const controls = Controls()
const sidePanel = SidePanel()
const alert = Alert()

// todo: alert users & handle reconnect if player disconnects in game,  
// todo: when user leaves game remove clientID from game.clients 
export default (initial) => ({
	state: {
		room: null,
		controls: controls.state,
		sidePanel: sidePanel.state,
		alert: alert.state,
		isLoading: true,
		sidePanelOpen: false,
		gameOver: false,
		initialized: false,
		fetching: false,
	},
	actions: {
		controls: controls.actions,
		sidePanel: sidePanel.actions,
		alert: alert.actions,
		toggleSidePanel:
			(tab, isOpen) =>
			({ sidePanel }) => {
				let newState = {
					sidePanel: {
						...sidePanel,
						isVisible: isOpen || !sidePanel.isVisible,
					},
				};
				if (tab) newState.sidePanel.currTab = tab;
				return newState;
			},
		showLoader: () => () => ({ isLoading: true }),
		hideLoader: () => () => ({ isLoading: false }),
		updateRoom: (room) => () => ({ room }),
		beginFetching: () => () => ({ fetching: true }),
		completeFetch: (room) => () => ({
			room,
			fetching: false,
			initialized: true,
		}),
		endGame: () => () => ({ gameOver: true }),
		exit: () => () => ({
			isLoading: true,
			fetching: false,
			initialized: false,
		}),
	},
	view:
		(state, actions) =>
		({ roomID, leaveGame }) => {
			const ControlsView = controls.view(
				state.controls,
				actions.controls
			);
			const SidePanelView = sidePanel.view(
				state.sidePanel,
				actions.sidePanel
			);
			const AlertView = alert.view(state.alert, actions.alert);
			/* todo: on total disconnect, breakdown websocket and game */
			const leave = () => {
				actions.alert.close("host");
				actions.exit();
				leaveGame();
				// todo update client.room to 'lobby'
			};

			const onJoin = ({ room }) => {
				if (room.players.length == 2) {
					// ready up player after camera animation
				}
				actions.updateRoom(room);
			};

			const readyUp = () => {
				// console.log('joining  ', ID)
				if (!dontSend) Api.ready(roomID);
				cleanupHandlers();
				joinGame(ID);
				actions.exit();
				actions.alert.close("host");
			};

			const initialize = async () => {
				// todo if player is opp & !matchStarted, alert match starting soon
				Api.setMessageHandlers({
					join: onJoin, // todo if players == 2 alert match starting soon
					start: () => {}, // todo begin whites clock
					idleReconnect: () => {}, 
				});
				actions.beginFetching();
				let room = await Api.getRoom(roomID);
				actions.completeFetch(room);
				const isHost = room.host == Api.getClientID();
				if (room.players.length == 1 && isHost) {
					actions.alert.show(alert.hostAlert);
				}
				// todo stop loading
			};

			if (!state.initialized && !state.fetching) {
				console.log(`Joined room [${Api.getClientID()}]`);
				initialize();
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
		},
});
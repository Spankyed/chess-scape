import { h } from 'hyperapp';
import Game from './game.js';
import Loader from './loader/loader'; 
import Controls from './controls/Controls'; 
import SidePanel from './sidePanel/sidePanel'; 
import Alert from '../Shared/Alert';
import Api from "../../api/Api";

const game = Game();
const controls = Controls()
const sidePanel = SidePanel()
const alert = Alert()

// todo: alert users & handle reconnect if player disconnects in game,  
// todo: when user leaves game remove clientID from game.clients 
export default (initial) => ({
	state: {
		room: null,
		game: game.state,
		alert: alert.state,
		controls: controls.state,
		sidePanel: sidePanel.state,
		sidePanelOpen: false,
		isHost: false,
		isLoading: true,
		isFetching: false,
		initialized: false,
		// matchStarted: false,
		gameOver: false,
		// playerColor: null,
	},
	actions: {
		game: game.actions,
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
		fetchRoom: (roomID) => (_,actions) => {
			Api.getRoom(roomID).then(actions.completeFetch)
			return { isFetching: true }
		},
		completeFetch: (room) => (_, actions) => {
			const isHost = room.host == Api.getClientID();
			const players = Object.entries(room.players);
			const [color, player] = players.find(p => p[1].clientID == Api.getClientID()) || []
			if (!room.matchStarted) {
				if ( players.length == 1 && isHost ) {
					actions.alert.show(alert.waitAlert);
				} else {
					actions.alert.show(alert.startAlert);
				}
			}

			actions.game.setPlayer({
				player,
				playerColor: color,
			});
				
			return {
				room,
				isHost,
				isFetching: false,
				initialized: true,
			};
		},
		getPlayerColor: () => () => ({ gameOver: true }),
		endGame: () => () => ({ gameOver: true }),
		exit: () => (_, { alert }) => {
			document.body.style.cursor = "default";
			cleanupHandlers();
			alert.closeAll();
			// ! todo update DB client.room to 'lobby' otherwise wont recieve join msgs
			return {
				isHost: false,
				isLoading: true,
				isFetching: false,
				initialized: false,
				matchStarted: false,
				game: {
					player: false,
					playerColor: null,
					ready: false,
					matchStarted: false,
				},
			};
		},
	},
	view:
		(state, actions) =>
		({ roomID, joinLobby }) => {
			const GameView = game.view(
				state.game,
				actions.game
			);
			const ControlsView = controls.view(
				state.controls,
				actions.controls
			);
			const SidePanelView = sidePanel.view(
				state.sidePanel,
				actions.sidePanel
			);
			const AlertView = alert.view(state.alert, actions.alert);

			const onJoin = ({ room, group }) => {
				if (group == 'players' &&
					Object.keys(room.players).length == 2 &&
					!room.matchStarted) {
					actions.alert.close("host");
					actions.alert.show(alert.startAlert); // alert match is starting soon
				}
				actions.updateRoom(room);
			};

			const initialize = async () => {
				// todo if player is opp & !matchStarted, alert match starting soon
				// todo: on total disconnect, breakdown websocket and game 
				Api.setMessageHandlers({
					join: onJoin, // todo if players == 2 alert match starting soon
					leave: ({ clientID }) => console.log(`[${clientID}] left the room`),
					idleReconnect: () => {},
				});
				actions.fetchRoom(roomID);
				// todo stop loading
			};

			if (!state.isLoading && !state.initialized && !state.isFetching) {
				console.log(`Joined room [${Api.getClientID()}]`);
				initialize();
			}

			const leave = () => {
				Api.leaveRoom(roomID);
				actions.exit();
				joinLobby();
			};

			return (
				<div class="h-full flex">
					<Loader isLoading={state.isLoading} alert={actions.alert} />

					<div class="relative flex-grow">
						<ControlsView
							roomID={roomID}
							isLoading={state.isLoading}
							gameOver={state.gameOver}
							leaveRoom={leave}
							toggleSidePanel={actions.toggleSidePanel}
						/>
						<GameView {...{ roomID, roomActions: actions, roomState: state }} />
						<AlertView />
					</div>

					<SidePanelView roomID={roomID} alert={actions.alert} />
				</div>
			);
		},
});

function cleanupHandlers(){
	Api.setMessageHandlers({
		join: () => {},
		start: () => {},
		idleReconnect: () => {},
	});	
}
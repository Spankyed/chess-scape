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

const initialState = {
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
	matchInfo: null,
	closed: false,
	// playerColor: null,
};

export default (initial) => ({
	state: initialState,
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
		fetchRoom: (roomID) => (_, actions) => {
			Api.getRoom(roomID).then(actions.completeFetch);
			return { isFetching: true };
		},
		completeFetch:
			({ room, match }) =>
			(_, actions) => {
				if (!room || !match) return { isFetching: false, initialized: true };
				const isHost = room.host == Api.getClientID();
				const players = Object.entries(room.players);
				const [color, player] =
					players.find((p) => p[1].clientID == Api.getClientID()) ||
					[];

				if (!match.matchStarted) {
					if (players.length == 1 && isHost) {
						actions.alert.show(alert.waitAlert);
					} else {
						actions.alert.show(alert.startAlert);
					}
				} else {
					Api.sync();
				}

				if (match.finished) {
					actions.endGame(match);
				}
				const setup = player ? {
					player,
					playerColor: color,
					committed: match.players[color]?.committed,
				} : {}
				actions.game.setPlayer(setup);

				return {
					room,
					isHost,
					gameOver: !!match.finished,
					isFetching: false,
					initialized: true,
				};
			},
		restartGame: () => () => ({ gameOver: false, matchInfo: null }),
		endGame:
			({ winningColor, endMethod, mated }) =>
			() => ({
				gameOver: true,
				matchInfo: { winningColor, endMethod, mated },
				}),
		// close: () => () => ({ closed: true }),
		exit:
			() =>
			(_, { alert }) => {
				document.body.style.cursor = "default";
				cleanupHandlers();
				alert.closeAll();
				// ! todo update DB client.room to 'lobby' otherwise wont receive join msgs
				return initialState;
			},
	},
	view:
		(state, actions) =>
		({ roomID, joinLobby }) => {
			const GameView = game.view(state.game, actions.game);
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
				if (
					group == "players" &&
					Object.keys(room.players).length == 2 &&
					!room.matchStarted
				) {
					actions.alert.close({ id: "host"});
					actions.alert.show(alert.startAlert); // alert match is starting soon
				}
				actions.updateRoom(room);
			};

			const initialize = async () => {
				// todo: on total disconnect, breakdown websocket and game
				Api.setMessageHandlers({
					join: onJoin, // todo if players == 2 alert match starting soon
					// leave: onLeave,
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
							leaveRoom={leave}
							roomState={state}
							toggleSidePanel={actions.toggleSidePanel}
							alert={actions.alert}
						/>
						<GameView
							{...{
								roomID,
								roomActions: actions,
								roomState: state,
							}}
						/>
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
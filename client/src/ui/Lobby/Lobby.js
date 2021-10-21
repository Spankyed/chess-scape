import { h } from 'hyperapp';
import Api from '../../api/Api';
import Create from "./create/create";
import Alert from '../Shared/Alert';
// import './lobby.scss';

const create = Create()
const alert = Alert()

export default (initial) => ({
	state: {
		create: create.state,
		alert: alert.state,
		showCreate: false,
		hostedRoom: null,
		rooms: [],
		loading: true,
		isFetching: false,
		initialized: false,
	},

	actions: {
		create: create.actions,
		alert: alert.actions,
		setLoad: (loading) => ({ loading }),
		toggleCreate: () => (state) => ({ showCreate: !state.showCreate }),
		updateRooms: (rooms) => (state, actions) => ({
			rooms: sortByCreated(rooms),
		}),
		updateRoom:
			(room) =>
			({ rooms }) => ({
				rooms: rooms.map((r) => (r.ID == room.ID ? room : r)),
			}),
		addRoom:
			({ newRoom }) =>
			({ rooms, hostedRoom }, actions) => {
				const isHost = newRoom.host == Api.getClientID();
				if (isHost) actions.alert.show(alert.hostAlert);
				return {
					rooms: sortByCreated([...rooms, newRoom]),
					hostedRoom: isHost ? newRoom.ID : hostedRoom,
				};
			},
		removeRoom:
			({ roomID }) =>
			({ rooms, hostedRoom }, { alert }) => {
				if (hostedRoom == roomID) alert.close({ id: "host" });
				return {
					rooms: rooms.filter((r) => r.ID != roomID),
					hostedRoom: hostedRoom == roomID ? null : hostedRoom,
				};
			},
		fetchRooms: () => (_, actions) => {
			Api.joinLobby().then(actions.completeFetch).catch(actions.exit);
			return { isFetching: true };
		},
		completeFetch:
			({ rooms }) =>
			(_, actions) => {
				const hostedRoomID = rooms.find(
					(room) => room.host == Api.getClientID()
				)?.ID;
				if (!!hostedRoomID) actions.alert.show(alert.hostAlert);
				actions.updateRooms(rooms);
				return {
					hostedRoom: hostedRoomID,
					loading: false,
					isFetching: false,
					initialized: true,
				};
			},
		exit:
			() =>
			(_, { alert }) => {
				cleanupHandlers();
				alert.closeAll();
				return { initialized: false, isFetching: false };
			},
	},

	view:
		(state, actions) =>
		({ joinRoom }) => {
			const {
				showCreate,
				hostedRoom,
				loading,
				isFetching,
				initialized,
				rooms,
			} = state;
			const CreateView = create.view(state.create, actions.create);
			const AlertView = alert.view(state.alert, actions.alert);
			window.isLoad = actions.setLoad;
			const refreshRoomList = async () => {
				let { rooms } = await Api.getRooms();
				actions.updateRooms(rooms);
			};

			const join = (ID) => {
				// console.log('joining  ', ID)
				joinRoom(ID);
				actions.exit();
				Api.joinRoom(ID);
			};

			const onJoin = ({ room }) => {
				if (room.host == Api.getClientID()) {
					// if someone joins room hosted by user, move user into room
					join(room.ID);
				}
				actions.updateRoom(room);
			};

			const cancel = async () => {
				await Api.deleteRoom(hostedRoom).catch(actions.exit);
				actions.alert.close({ id: "host" });
			};

			const initialize = async () => {
				await Api.createConnection(); // create new connection every time user visits lobby? should only connect once
				Api.setMessageHandlers({
					create: actions.addRoom,
					delete: actions.removeRoom,
					join: onJoin,
					// disconnect: Api.reconnect(), //! if hosting game, reconnect immediately
					idleReconnect: refreshRoomList, // todo refreshRoomList on all reconnects instead
				});
				actions.fetchRooms();
				// todo stop loading
			};

			if (!initialized && !isFetching) {
				console.log(`Joined lobby [${Api.getClientID()}]`);
				initialize();
			}

			return (
				<div class="lobby">
					<CreateView
						showCreate={showCreate}
						toggleCreate={actions.toggleCreate}
					/>
					<AlertView />

					<div class="lobby-main">
						{/* Header */}
						<div class="lobby-header">
							<h1 class="title"> Lobby </h1>
							<div>
								{!hostedRoom ? (
									<button onclick={actions.toggleCreate}>
										<img src="./assets/create/add.svg"></img>
										<p> New Game </p>
									</button>
								) : (
									<button onclick={cancel} class="cancel">
										<img src="./assets/create/cancel.svg"></img>
										<p> Cancel </p>
									</button>
								)}
							</div>
						</div>
						{/* Table */}
						<div class="table-wrapper">
							{!loading && !state.rooms?.length > 0 ? (
								<div class="table-empty">
									{/* if not game rooms, show some  ui */}
									{/* <img class="w-full" src="./assets/empty.svg" style="max-height: 150px;"/> */}
									<svg
										fill="white"
										viewBox="0 0 64 64"
										xmlns="http://www.w3.org/2000/svg"
									>
										<path d="M16.152 1.9zM29.582 36.529l1.953.407c.757-3.627 4.07-6.065 7.389-5.436l.372-1.96c-4.378-.823-8.735 2.304-9.714 6.989z" /><path d="M62.278 56.41l-9.298-9.288-.888.888-1.576-1.586a15.194 15.194 0 00-2.035-19.095c-4.2-4.21-10.276-5.427-15.573-3.681-.489-2.993-1.127-5.627-1.537-6.794C27.571 5.95 18.153.702 17.135.164a1.15 1.15 0 00-1.147-.02c-.35.2-.579.588-.579 1.007V6.3c-.26-.02-.538-.03-.808-.02-2.484.05-4.878 1.327-6.395 3.412-2.324 3.232-6.474 6.265-7.282 6.834l-.42.3v.398l-.08.33 3.004 5.836.289.429 1.037.239.41-.429c1.197-1.297 5.018-2.025 8.918-2.265-1.366 1.866-2.993 4.999-4.848 9.358a17.666 17.666 0 00-1.427 6.984c0 .459-.16 1.007-.449 1.616-.269.539-.648 1.127-1.047 1.656a2.903 2.903 0 01-1.776 1.087l-.818.16v3.87H1.253v7.433h35.506v-.17c3.222.2 6.474-.618 9.238-2.424l1.576 1.587-.888.888 9.308 9.298a4.462 4.462 0 006.285 0 4.467 4.467 0 000-6.295zM11.07 31.51c2.394-5.617 4.539-9.428 5.826-10.246.399-.3.548-.828.369-1.277-.17-.46-.629-.739-1.028-.689-2.065.02-8.43.25-11.542 2.175l-1.956-3.8c1.537-1.148 4.978-3.882 7.084-6.805 1.157-1.586 2.952-2.554 4.818-2.594.499-.02.958.03 1.387.12.339.08.688.01.958-.21.269-.209.419-.528.419-.877v-4.67c2.793 1.767 9.178 6.555 12.08 14.875.4 1.138 1.058 3.871 1.527 6.904a14.863 14.863 0 00-4.11 2.913c-2.853 2.844-4.32 6.555-4.44 10.296H9.813c.01-2.125.43-4.18 1.258-6.116zM5.712 43.8a4.987 4.987 0 002.185-1.606A13.68 13.68 0 009.154 40.2c.09-.2.17-.39.24-.579h13.118a15.24 15.24 0 002.185 6.475H5.712V43.8zm-2.464 7.732V48.09h22.916c.24.28.479.559.738.818a15.6 15.6 0 003.502 2.624H3.248zm41.741-6.185c-4.08 4.14-10.545 4.05-14.555.04a10.195 10.195 0 01-3.013-7.263c0-2.754 1.067-5.328 3.003-7.263 4.02-4.02 10.515-4.02 14.525-.01 4.16 4.14 3.971 10.645.04 14.496z" /><path d="M14.87 12.903a1.371 1.371 0 01-2.744 0c.001-.758.62-1.366 1.378-1.366.748 0 1.367.608 1.367 1.366z" />
									</svg>
									<div class="message">
										No games to play here ...
									</div>
								</div>
							) : (
								<table>
									<TableHead />
									{/* Room List */}
									{loading ? (
										<LoadingTable />
									) : (
										<RoomsTable {...{ rooms, join }} />
									)}
								</table>
							)}
						</div>
					</div>
				</div>
			);
		},
});

function TableHead() {
	const headings = ["Host", "Game", "Time", "Players", "Color", "Action"];
	return (
		<thead>
			<tr>
				{headings.map((heading) => (
					<th scope="col" class={`${heading}`}>
						<span>{heading != 'Action' && heading}</span>
					</th>
				))}
			</tr>
		</thead>
	);
}
function LoadingTable() {
	return (
		<tbody class="loading-table">
			{[...new Array(3)].map((_) => (
				<tr>
					<td class="host">
						<span class="img"></span>
						<span class="data"></span>
					</td>
					<td class="game">
						<span class="img"></span>
					</td>
					<td class="time">
						<span class="data"></span>
					</td>
					<td class="players">
						<span></span>
					</td>
					<td class="color">
						<span class="img"></span>
					</td>
					<td class="enter">
						<span></span>
					</td>
				</tr>
			))}
		</tbody>
	);
}
function RoomsTable({rooms, join}) {
	return (
		<tbody class="room-table">
			{/* {[...new Array(6)].map((room, idx) => ( */}
			{rooms.map((room, idx) => (
				// <tr class={`${idx % 2 ? '': 'bg-gray-800'} my-3 text-lg font-large`}>
				<RoomItem {...{ room, join, idx }} />
			))}
		</tbody>
	);
}

// const roomModel = {
// 	gameOptions: {
// 		name: "forever",
// 		time: { minutes: "—", increment: "—" },
// 		pin: 54,
// 		pinEnabled: true,
// 	},
// 	ID: "65",
// 	host: "94",
// 	hostName: "spankied",
// 	selectedColor: "white",
// 	players: { white: { clientID: "94" } },
// 	matchStarted: false,
// };
function RoomItem({room, join}) {
	// room = roomModel;
	const players = Object.values(room?.players||{})
	const isHost = room?.host == Api.getClientID()
	const isPlayer = isHost || players?.find((p) => p.clientID == Api.getClientID());
	const isFull = players?.length > 1
	const userImg = `https://avatars.dicebear.com/api/avataaars/${room.hostName}.svg`
	return (
		<tr class={` ${isHost && "selected-room"}`}>
			<td class="host">
				<img class="img" src={userImg} />
				<span>{room.hostName}</span>
			</td>
			<td class="game">
				<img
					class="cap-img"
					src={`./assets/create/types/${room.gameOptions.name}.svg`}
					alt="game type"
				/>
			</td>
			<td class="time">
				{room.gameOptions.name == "forever" ? (
					<div>
						<span class="min">
							{" "}
							{room.gameOptions.time.minutes}{" "}
						</span>
						<span> {room.gameOptions.time.increment} </span>
					</div>
				) : (
					<div>
						<span class="min">
							{room.gameOptions.time.minutes} min
						</span>
						<span>+ {room.gameOptions.time.increment} sec</span>
					</div>
				)}
			</td>
			<td class="players">
				<span class={`${isFull && "full"}`}>
					{/* <span class="hidden lg:inline">
						{`${isFull ? "Max" : "Open"}`}
					</span> */}
					{players?.length}/2
				</span>
			</td>
			<td class="color">
				<img
					class="cap-img"
					src={`./assets/lobby/piece-${room.selectedColor}.svg`}
				/>
			</td>
			<td class="action">
				<button
					onclick={() => join(room?.ID)}
					class={`${isHost && "host"}`}
				>
					{isHost
						? "Enter"
						: `${isPlayer || !isFull ? "Play" : "Watch"} `}
				</button>
			</td>
		</tr>
	);
}


function sortByCreated(arr) {
	return (arr || []).sort((a, b) => b.created - a.created)
}
function cleanupHandlers(){
	Api.setMessageHandlers({
		create:()=>{},
		delete:()=>{},
		join: ()=>{},
		idleReconnect: ()=>{},
	});	
}
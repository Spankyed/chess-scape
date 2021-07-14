import { h } from 'hyperapp';
import Create from './Create';
// import './lobby.scss';
import Api from '../../api/Api';

const create = Create()


export default initial => ({
	state: { 
		create: create.state,
		showCreate: false,
		gameRooms: []
	},

	actions: { 
		create: create.actions,
		toggleCreate: () => (state) => ({ showCreate: !state.showCreate}),
		updateRooms: ({gameRooms}) => (state) => ({ gameRooms })
	},

	view: (state, actions) => ({joinGame}) => {
		const { showCreate } = state
		const CreateView = create.view(state.create, actions.create)

		const init = () => {
			Api.createConnection() // create new connection everytime user visits lobby? should only connect once
			Api.setMessageHandlers({
				create: actions.updateRooms,
				// create: (msg) => console.log('some1 created', msg),
				join: (msg) => console.log('some1 joined', msg),
				// join: joinGame,
			})
			Api.fetchRooms().then( rooms => {
				console.log('eskkitit',rooms)
				actions.updateRooms({gameRooms: rooms})
			})
		}

		const join = (id) => () => {
			console.log('joining', id)
			Api.joinGame(id)
			joinGame(id)
		}

		return ( 
			<div oncreate={init} class="flex pt-10 justify-center min-h-screen bg-gray-900 font-sans">

				{ showCreate && <CreateView showCreate={showCreate} toggleCreate={actions.toggleCreate}/> }

				<div class="col-span-12">
					{/* Header */}
					<div class="px-4 md:px-10 py-5">
						<div class="sm:flex items-center justify-between">
							<h1 tabindex="0" class="title px-5 focus:outline-none text-base font-bold leading-normal text-gray-100">
								Game Rooms
							</h1>
							<div>
								<button onclick={actions.toggleCreate} class="focus:ring-2 focus:ring-offset-2 focus:ring-indigo-600 inline-flex sm:ml-3 mt-4 sm:mt-0 items-start justify-start px-4 py-2 bg-indigo-700 hover:bg-indigo-600 focus:outline-none rounded ">
									<p class="text-xl font-medium leading-none text-white">New Game</p>
								</button>
							</div>
						</div>
					</div>
					
					<div class="overflow-auto lg:overflow-visible shadow-md rounded-lg bg-gray-700 ">
						<table class="table text-gray-400 border-separate space-y-6 text-sm">
							<thead class="bg-gray-800 text-gray-300 text-center  rounded uppercase text-lg font-large tracking-wider">
								<tr>
									<th scope="col" class="px-6 py-3 ">Challenger</th>
									<th class="p-3">Game Type</th>
									<th class="p-3">Time</th>
									<th class="p-3">Players</th>
									<th class="p-3"></th>
								</tr>
							</thead>
							{/* Room List */}
							<tbody>
							{/* if not game rooms, show some other ui */}
							{	state.gameRooms.map( room => (
									<tr class="bg-gray-800 rounded-lg border-b border-gray-500  text-lg font-large">
										<td class="py-3 px-6 text-left border-b border-gray-500">
											<div class="flex items-center font-lg">
												<div class="mr-2">
													<img class="w-6 h-6 rounded-full" src="https://randomuser.me/api/portraits/men/1.jpg"/>
												</div>
												<span>Eshal Rosas</span>
											</div>
										</td>
										<td class="p-3 px-6  border-b border-gray-500">
											Blitz 1 (lightning bolt)
										</td>
										<td class="p-3 px-6  font-bold  border-b border-gray-500">
											10:00
										</td>
										<td class="py-3 px-6 text-center border-b border-gray-500">
											<span class={`${room.clients.length >= 2 ? 'bg-red-200 text-red-900' : 'bg-green-200 text-green-900'} py-1 px-3 rounded-full  font-semibold`}>
												{`${room.clients.length >= 2 ? 'Full':'Open'} `} ({room.clients.length}/2)
											</span>
										</td>
										<td class="px-6 py-3 whitespace-no-wrap text-right text-lg leading-5 border-b border-gray-500  font-semibold ">
											<button onclick={join(room.id)} class="px-5 py-2 border-blue-700 border text-white rounded transition duration-300 hover:bg-blue-700 hover:text-white focus:outline-none">
											{`${room.clients.length >= 2 ? 'Spectate':'Join'} `}
											</button>
										</td>
									</tr>
								))
							}
							</tbody>
						</table>
					</div>
				</div>
			</div>
		)
	}
})

function isTwoOrMore(arr){
	arr.length >= 2
}
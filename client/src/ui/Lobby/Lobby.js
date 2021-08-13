import { h } from 'hyperapp';
import Create from './create';
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

		const init = async () => {
			Api.createConnection() // create new connection everytime user visits lobby? should only connect once
			console.log('connection created')
			Api.setMessageHandlers({
				create: actions.updateRooms,
				// todo: update roomlist with new player count, for only players in lobby (not ingame rooms)
				// join: (msg) => console.log('some1 joined', msg), 
			})
			// todo retry 3 times delayed if no rooms retrieved
			let rooms = await Api.fetchRooms()
			actions.updateRooms({gameRooms: rooms})
		}

		const join = (id) => () => {
			// console.log('joining  ', id)
			Api.joinGame(id)
			joinGame(id)
		}

		return ( 
			<div oncreate={init} class="lobby flex pt-10 justify-center min-h-screen font-sans" ondestroy={_=>console.log('destroyed!!!')}>

				{ showCreate && <CreateView showCreate={showCreate} toggleCreate={actions.toggleCreate}/> }

				<div class="col-span-12">
					{/* Header */}
					<div class="px-4 md:px-10 py-5" style='height:18vh'>
						<div class="sm:flex items-center justify-between">
							<h1 tabindex="0" class="title px-5 focus:outline-none text-base font-bold leading-normal text-gray-100">
								Game Rooms
							</h1>
							<div>
								<button onclick={actions.toggleCreate} class="ring-2 ring-offset-2 focus:ring-indigo-900 px-4 py-2 bg-indigo-700 hover:bg-indigo-600 focus:outline-none">
									<p class="text-xl font-medium leading-none text-white">New Game</p>
								</button>
							</div>
						</div>
					</div>
					<div class="p-10 bg-gray-700">
						<div class="table_wrapper overflow-auto pr-3" style='height:55vh'>
						{	!state.gameRooms?.length > 0 ? 
							<div class="w-full h-64 text-center" style="justify-content: center; align-items: center">
								{/* <img class="w-full" src="./assets/empty.svg" style="max-height: 150px;"/> */}
								<svg class="text-center w-full h-64"fill="white" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><path d="M16.152 1.9zM29.582 36.529l1.953.407c.757-3.627 4.07-6.065 7.389-5.436l.372-1.96c-4.378-.823-8.735 2.304-9.714 6.989z"/><path d="M62.278 56.41l-9.298-9.288-.888.888-1.576-1.586a15.194 15.194 0 00-2.035-19.095c-4.2-4.21-10.276-5.427-15.573-3.681-.489-2.993-1.127-5.627-1.537-6.794C27.571 5.95 18.153.702 17.135.164a1.15 1.15 0 00-1.147-.02c-.35.2-.579.588-.579 1.007V6.3c-.26-.02-.538-.03-.808-.02-2.484.05-4.878 1.327-6.395 3.412-2.324 3.232-6.474 6.265-7.282 6.834l-.42.3v.398l-.08.33 3.004 5.836.289.429 1.037.239.41-.429c1.197-1.297 5.018-2.025 8.918-2.265-1.366 1.866-2.993 4.999-4.848 9.358a17.666 17.666 0 00-1.427 6.984c0 .459-.16 1.007-.449 1.616-.269.539-.648 1.127-1.047 1.656a2.903 2.903 0 01-1.776 1.087l-.818.16v3.87H1.253v7.433h35.506v-.17c3.222.2 6.474-.618 9.238-2.424l1.576 1.587-.888.888 9.308 9.298a4.462 4.462 0 006.285 0 4.467 4.467 0 000-6.295zM11.07 31.51c2.394-5.617 4.539-9.428 5.826-10.246.399-.3.548-.828.369-1.277-.17-.46-.629-.739-1.028-.689-2.065.02-8.43.25-11.542 2.175l-1.956-3.8c1.537-1.148 4.978-3.882 7.084-6.805 1.157-1.586 2.952-2.554 4.818-2.594.499-.02.958.03 1.387.12.339.08.688.01.958-.21.269-.209.419-.528.419-.877v-4.67c2.793 1.767 9.178 6.555 12.08 14.875.4 1.138 1.058 3.871 1.527 6.904a14.863 14.863 0 00-4.11 2.913c-2.853 2.844-4.32 6.555-4.44 10.296H9.813c.01-2.125.43-4.18 1.258-6.116zM5.712 43.8a4.987 4.987 0 002.185-1.606A13.68 13.68 0 009.154 40.2c.09-.2.17-.39.24-.579h13.118a15.24 15.24 0 002.185 6.475H5.712V43.8zm-2.464 7.732V48.09h22.916c.24.28.479.559.738.818a15.6 15.6 0 003.502 2.624H3.248zm41.741-6.185c-4.08 4.14-10.545 4.05-14.555.04a10.195 10.195 0 01-3.013-7.263c0-2.754 1.067-5.328 3.003-7.263 4.02-4.02 10.515-4.02 14.525-.01 4.16 4.14 3.971 10.645.04 14.496z"/><path d="M14.87 12.903a1.371 1.371 0 01-2.744 0c.001-.758.62-1.366 1.378-1.366.748 0 1.367.608 1.367 1.366z"/></svg>
								<div class="w-full text-center text-gray-300 text-xl font-medium leading-none">Nothing to see here</div>
							</div>
							:
							<table class="table border-collapse text-gray-400 text-sm">
								<thead class="text-gray-400 text-center uppercase text-lg font-large tracking-wider">
									<tr class="">
										<th scope="col" class="px-5 py-3 bg-gray-700 border-b border-gray-500">
											<span class='block bg-gray-700 h-full w-full'>
												Challenger
											</span>
										</th>
										<th scope="col" class="px-5 py-3 bg-gray-700 border-b border-gray-500">
											<span class='block bg-gray-700 h-full w-full'>
											Game Type
											</span>
										</th>
										<th scope="col" class="px-5 py-3 bg-gray-700 border-b border-gray-500">
											<span class='block bg-gray-700 h-full w-full'>
											Time
											</span>
										</th>
										<th scope="col" class="px-5 py-3 bg-gray-700 border-b border-gray-500">
											<span class='block bg-gray-700 h-full w-full'>
											Players
											</span>
										</th>
										<th scope="col" class="px-5 py-3 bg-gray-700 border-b border-gray-500">
											<span class='block bg-gray-700 h-full w-full'>
											Opp. Color
											</span>
										</th>
										<th scope="col" class="px-5 py-3 bg-gray-700 border-b border-gray-500">
											<span class='block bg-gray-700 h-full w-full'>
											&#8203;
											</span>
										</th>
									</tr>
								</thead>
								{/* Room List */}

								<tbody class="text-gray-300 border-b border-gray-500">
							{/* if not game rooms, show some other ui */}


							{	state.gameRooms.map( (room, idx) => (
									// <tr class={`${idx % 2 ? '': 'bg-gray-800'} my-3 text-lg font-large`}>
									<tr class={` my-3 text-lg font-large`}>
										<td class="py-3 px-6 text-left">
											<div class="flex items-center font-lg">
												<div class="mr-2">
													<img class="w-6 h-6 rounded-full" src="https://randomuser.me/api/portraits/men/1.jpg"/>
												</div>
												<span>John Doe</span>
											</div>
										</td>
										<td class="p-3 px-6">
											Blitz 1 (lightning bolt)
										</td>
										<td class="p-3 px-6 font-bold">
											10:00
										</td>
										<td class="py-3 px-6 text-center">
											<span class={`${room.clients.length >= 2 ? 'bg-red-200 text-red-900' : 'bg-green-200 text-green-900'} py-1 px-3 rounded-full  font-semibold`}>
												<span class="hidden lg:inline">
													{`${room.clients.length >= 2 ? 'Max':'Open'} `} 
												</span>
												({room.clients.length}/2)
											</span>
										</td>
										<td class="p-3 px-6 font-bold">
											Black
										</td>
										<td class="px-6 py-3 whitespace-no-wrap text-right text-lg leading-5 font-semibold">
											<button onclick={join(room.id)} class="focus:outline-none">
											{`${room.clients.length >= 2 ? 'Spectate':'Join'} `}
											</button>
										</td>
									</tr>
								))
							}
							</tbody>
							
							</table>
						}
						</div>
					</div>

				</div>
			</div>
		)
	}
})


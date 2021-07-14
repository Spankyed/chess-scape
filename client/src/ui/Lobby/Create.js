import { h } from 'hyperapp';
// todo: if in game and websocket disconnects, reconnect 
import Api from '../../api/Api';

export default initial => ({
	state: {
		gameTypes: [
			{ id: 1, name: 'Bullet', time: '1 min', src: `./assets/bullet.svg` },
			{ id: 2, name: 'Blitz', time: '5 min', src: `./assets/fighter_jet.svg` },
			{ id: 3, name: 'Rapid', time: '10 min', src: `./assets/lightning.svg` },
			{ id: 4, name: 'Custom', time: '--', src: `./assets/custom.svg` },
		]
	},
	actions: { 
	},
	view: ({gameTypes}, actions) => ({ showCreate, toggleCreate }) => {

		const toggle = (ev) => {
			ev.stopPropagation();
			toggleCreate()
		};
		
		const create = (ev) => {
			console.log('creating')
			ev.stopPropagation();
			Api.createGame()
			toggleCreate()
		};
		
		const dangerouslySetInnerHTML = (html) => element => element.innerHTML = html;
		
		return ( 
			<div class={`${showCreate ? '': 'opacity-0'} modal  fixed w-full h-full top-0 left-0 flex items-center justify-center`}>
				{/* Create Modal */}
				<div onclick={toggle} class="modal-overlay absolute w-full h-full bg-gray-900 opacity-50"></div>

				<div class="modal-container bg-white w-11/12 md:max-w-md mx-auto rounded shadow-lg z-50 overflow-y-auto">
					
					{/* <div class="modal-close absolute top-0 right-0 cursor-pointer flex flex-col items-center mt-4 mr-4 text-white text-sm z-50">
						<svg class="fill-current text-white" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18">
							<path d="M14.53 4.53l-1.06-1.06L9 7.94 4.53 3.47 3.47 4.53 7.94 9l-4.47 4.47 1.06 1.06L9 10.06l4.47 4.47 1.06-1.06L10.06 9z"></path>
						</svg>
						<span class="text-sm">(Esc)</span>
					</div> */}

					<div style="display: flex; justify-content: center; align-items: center" class="chooseColorNewGame">
						<img id="startingColor1" onclick="selectColor(1)" src="./assets/queen_w.png" style="max-height: 90px;"/>
						<img id="startingColor0" onclick="selectColor(0)" class="selected" src="./assets/queen_bw.png" style="max-height: 120px;"/>
						<img id="startingColor2" onclick="selectColor(2)" src="./assets/queen_b.png" style="max-height: 90px;"/>
					</div>

					{/* <!-- Add margin if you want to see some of the overlay behind the modal--> */}
					<div class="modal-content py-4 text-left px-6">
					{/* <!--Title--> */}
						<div class="flex justify-between items-center grid grid-cols-3 lg:grid-cols-2 gap-5 w-full">
							{
								gameTypes.map(type => (
									<div class="bg-green-200 py-2 rounded-md">
										<div class="flex">
											<div class="w-2/3">
												<h2 class="text-base md:text-md lg:text-md px-4 whitespace-no-wrap text-gray-600">
													{type.name}
												</h2>
												<h3 class="text-base md:text-md lg:text-md px-8 py-2 text-gray-600">
													{type.time}
												</h3>
											</div>
											<div class="w-1/3 flex justify-center items-center mr-2">
												<img src={type.src} alt="game type"/>
											</div >
										</div>
									</div>
								))
							}
						</div>
						{/* fill: orange; */}
						



						{/* <!--Body--> */}
						{/* <p>Modal content can go here</p>
						<p>...</p>
						<p>...</p>
						<p>...</p>
						<p>...</p> */}
						<div class="flex mt-6">
							<label class="flex items-start">
								<input type="checkbox" class="form-checkbox h-6 w-6"/>
								<span class="ml-2">VS Computer</span>
							</label>
						</div>
						<div class="flex mt-6">
							<label class="flex items-start">
								<input type="checkbox" class="form-checkbox h-6 w-6"/>
								<span class="ml-2">
									Private Match 
									( <span class="underline">invite only</span> )
								</span>
							</label>
						</div>				
					</div>

					{/* <!--Footer--> */}
					<div onclick={create} class="modal-footer bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse ">
						<button type="button" class="w-full inline-flex justify-center rounded-sm border border-transparent shadow-sm px-4 py-2  text-base font-medium text-white bg-indigo-500 hover:bg-indigo-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm">
							Create Match
						</button>
						<button onclick={toggle} type="button" class="mt-3 w-full inline-flex justify-center rounded-sm border border-gray-300 shadow-sm px-4 py-2 bg-gray-50 text-base font-medium text-gray-700 hover:bg-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm">
							Cancel
						</button>
					</div>
					{/* <div class="flex justify-end pt-2">
						<button class="px-4 bg-transparent p-3 rounded-lg text-indigo-500 hover:bg-gray-100 hover:text-indigo-400 mr-2">
							Close
						</button>
						<button class="modal-close px-4 bg-indigo-500 p-3 rounded-lg text-white hover:bg-indigo-400">
							Create Match
						</button>
					</div> */}
				</div>
			</div>
		)
	}
})

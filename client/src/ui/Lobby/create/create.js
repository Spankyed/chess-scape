import { h } from "hyperapp";
// todo: if in game and websocket disconnects, reconnect
import Api from "../../../api/Api";
import Custom from "./Custom";

const custom = Custom();

const gameTypes = [
	{
		id: 0,
		name: "Forever..",
		src: `./assets/create/time/forever.svg`,
	},
	{
		id: 1,
		name: "Rapid",
		time: "10 min",
		src: `./assets/create/time/rapid.svg`,
	},
	{
		id: 2,
		name: "Blitz",
		time: "5 min",
		src: `./assets/create/time/blitz.svg`,
	},
	{
		id: 3,
		name: "Bullet",
		time: "3 min",
		src: `./assets/create/time/bullet.svg`,
	},
];

export default (initial) => ({
	state: {
		selectedColor: "random",
		selectedGameType: 0,
		gameTypes,
		custom: custom.state,
		submitText: "Create Room",
	},
	actions: {
		custom: custom.actions,
		selectColor: (color) => (state) => ({
			selectedColor: color,
		}),
		selectGameType: (gameType) => (state) => ({
			selectedGameType: gameType,
		}),
		attemptSubmit: () => ({
			attemptingSubmit: true,
			submitText: "Please wait...",
			error: { show: false },
		}),
		endAttempt: () => ({
			attemptingSubmit: false,
			submitText: "Create Room",
		}),
	},
	view:
		(state, actions) =>
		({ showCreate, toggleCreate }) => {
			const { gameTypes, selectedColor, selectedGameType } = state;
			const CustomView = custom.view(state.custom, actions.custom);

			// todo close modal using esc key
			const toggle = (ev) => {
				ev.stopPropagation();
				toggleCreate();
			};

			const create = async (ev) => {
				ev.stopPropagation();
				const random = Math.random() >= 0.5 ? 1 : 0;
				const {
					opponents,
					isSelectingOpp, // remove custom state props
					...customOptions
				} = state.custom;
				const { src, ...gameOptions } = selectedGameType;
				let gameRoom = {
					selectedColor:
						selectedColor == "random"
							? [("white", "black")][random]
							: selectedColor,
					gameType:
						selectedGameType == "custom"
							? customOptions
							: gameOptions,
				};
				try {
					actions.attemptSubmit();
					let room = await Api.createGameRoom(gameRoom); // dont update room list with response, websocket message should be sent to update room list in lobby
					if (room) {
						toggleCreate();
					}
					actions.endAttempt();
				} catch (err) {
					console.log(err);
					// if (!err.hidden) actions.showError(err);
					actions.endAttempt();
				}
			};

			return (
				<div
					class={`${
						showCreate ? "" : "opacity-0 pointer-events-none"
					} create-wrapper modal fixed w-full h-full top-0 left-0`}
				>
					{showCreate && (
						<div class="create flex items-center justify-center">
							<div
								onclick={toggle}
								class="modal-overlay absolute w-full h-full bg-gray-900 opacity-50"
							></div>

							<div class="bg-white w-11/12 max-w-md mx-auto rounded shadow-lg z-50">
								{/* <div class="modal-close absolute top-0 right-0 cursor-pointer flex flex-col items-center mt-4 mr-4 text-white text-sm z-50">
								<svg class="fill-current text-white" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18">
									<path d="M14.53 4.53l-1.06-1.06L9 7.94 4.53 3.47 3.47 4.53 7.94 9l-4.47 4.47 1.06 1.06L9 10.06l4.47 4.47 1.06-1.06L10.06 9z"></path>
								</svg>
								<span class="text-sm">(Esc)</span>
							</div> */}

								<ColorSelect
									{...actions}
									{...{ selectedColor }}
								/>

								{/* <!-- Add margin if you want to see some of the overlay behind the modal--> */}
								<div class="create-content py-4 text-left px-6 overflow-auto">
									{/* <!--Title--> */}
									<div class="justify-between items-center grid grid-cols-2 gap-5 w-full">
										{gameTypes.map((type) => (
											<GameType
												{...actions}
												{...{
													type,
													selectedGameType,
												}}
											/>
										))}
									</div>

									<CustomView
										{...actions}
										{...{
											selectGameType:
												actions.selectGameType,
											selectedGameType,
										}}
									/>
								</div>

								{/* <!--Footer--> */}
								<Footer {...{ create, toggle }} />
							</div>
						</div>
					)}
				</div>
			);
		},
});

function ColorSelect({ selectedColor, selectColor }) {
	const colors = ["white", "random", "black"];
	return (
		<div class="choose-color cursor-pointer">
			{colors.map((color, idx) => (
				<div
					class={`piece-color ${
						color == selectedColor && "selected"
					}`}
				>
					<img
						id={`color-select-${color}`}
						onclick={(_) => selectColor(color)}
						src={`./assets/create/piece-${color}.svg`}
						style="max-height: 90px;"
						// style="max-height: 120px;"
					/>
				</div>
			))}
		</div>
	);
}

function GameType({ type, selectGameType, selectedGameType }) {
	return (
		<div
			onclick={() => selectGameType(type)}
			class={`cursor-pointer bg-green-200 py-2 rounded-md ${
				type == selectedGameType && "selected"
			}`}
			style="min-height:85px"
		>
			<div class="flex">
				<div class="w-2/3">
					<h2 class="text-base md:text-md lg:text-md px-4 whitespace-no-wrap text-gray-600">
						{type.name}
					</h2>
					{type.time && (
						<h3 class="text-base md:text-md lg:text-md px-8 py-2 text-gray-600">
							{type.time}
						</h3>
					)}
				</div>
				<div class="w-1/3 flex justify-center items-center mr-2">
					<img src={type.src} alt="game type" />
				</div>
			</div>
		</div>
	);
}

function Footer({ create, toggle }) {
	return (
		<div
			onclick={create}
			class="modal-footer bg-gray-50 pb-3 px-6 flex flex-row-reverse "
		>
			<button
				type="button"
				class="w-full mt-3 inline-flex justify-center rounded-sm border border-transparent shadow-sm px-4 py-2  
				text-base font-medium text-white bg-indigo-500 hover:bg-indigo-400 focus:outline-none focus:ring-2
				focus:ring-offset-2 focus:ring-red-500 ml-3 w-auto text-sm"
			>
				Create Room
			</button>
			<button
				onclick={toggle}
				type="button"
				class="mt-3 w-full inline-flex justify-center rounded-sm border border-gray-300 shadow-sm px-4 py-2 
				bg-gray-50 text-base font-medium text-gray-700 hover:bg-white focus:outline-none focus:ring-2
				focus:ring-offset-2 focus:ring-indigo-500 mt-0 ml-3 w-auto text-sm"
			>
				Cancel
			</button>
		</div>
	);
}

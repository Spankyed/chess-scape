import { h } from "hyperapp";
// todo: if in game and websocket disconnects, reconnect
import Api from "../../../api/Api";
import { Custom } from "./custom";

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
		selectedGameType: gameTypes[0],
		gameTypes,
		customType: {},
	},
	actions: {
		selectColor: (color) => (state) => ({
			selectedColor: color,
		}),
		selectGameType: (id) => (state) => ({
			selectedGameType: state[id],
		}),
		setCustomProp:
			({ prop, value }) =>
			(state) => {
				return {
					customType: { ...state.customType, [prop]: value },
				};
			},
	},
	view:
		({ gameTypes, selectedColor, selectedGameType, customType }, actions) =>
		({ showCreate, toggleCreate }) => {
			// todo close modal using esc key
			const toggle = (ev) => {
				ev.stopPropagation();
				toggleCreate();
			};

			const create = (ev) => {
				ev.stopPropagation();
				const random = Math.random() >= 0.5 ? 1 : 0;
				let gameRoom = {
					selectedColor:
						selectedColor == "random"
							? [("white", "black")][random()]
							: selectedColor,
					selectedGameType:
						selectedGameType == "custom"
							? customType
							: selectedGameType,
				};
				Api.createGame(gameRoom);
				toggleCreate();
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

								<ColorSelect {...actions} />

								{/* <!-- Add margin if you want to see some of the overlay behind the modal--> */}
								<div class="create-content py-4 text-left px-6 overflow-auto">
									{/* <!--Title--> */}
									<div class="justify-between items-center grid grid-cols-2 gap-5 w-full">
										{gameTypes.map((type, idx) => (
											<GameType {...{ type, idx }} />
										))}
									</div>

									<Custom
										{...actions}
										{...{
											gameTypes,
											selectedColor,
											selectedGameType,
											customType,
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

function ColorSelect({ selectColor }) {
	const colors = ["white", "random", "black"];
	return (
		<div class="choose-color">
			{colors.map((color, idx) => (
				<div class={`piece-color ${idx == 1 && "selected"}`}>
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

function GameType({ type, idx }) {
	return (
		<div
			onclick={() => selectGameType(idx)}
			class={`bg-green-200 py-2 rounded-md ${idx == 2 && "selected"}`}
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

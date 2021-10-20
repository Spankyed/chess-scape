import { h } from "hyperapp";
import { delay } from "nanodelay";
import debounce from "tiny-debounce";
import Api from "../../../api/Api";
import Custom from "./Custom";

const custom = Custom();

const gameTypes = [
	{
		id: 0,
		name: "forever",
		time: { minutes: "--", increment: "--" },
	},
	{
		id: 1,
		name: "rapid",
		time: { minutes: 10, increment: 5 },
	},
	{
		id: 2,
		name: "blitz",
		time: { minutes: 5, increment: 5 },
	},
	{
		id: 3,
		name: "bullet",
		time: { minutes: 3, increment: 3 },
	},
];

const initialState = {
	selectedColor: "random",
	selectedGameType: 0,
	gameTypes,
	custom: custom.state,
	submitText: "Create Room",
}

export default (initial) => ({
	state: initialState,
	actions: {
		custom: custom.actions,
		selectColor: (color) => (state) => ({
			selectedColor: color,
		}),
		selectGameType:
			(id) =>
			(_, { custom }) => {
				if (_.custom.customTimeSet) custom.ignoreCustomTime();
				return { selectedGameType: id };
			},
		attemptSubmit: () => ({
			attemptingSubmit: true,
			submitText: "Please wait...",
			error: { show: false },
		}),
		endAttempt: () => ({
			attemptingSubmit: false,
			submitText: "Create Room",
		}),
		reset: () => initialState,
	},
	view:
		(state, actions) =>
		({ showCreate, toggleCreate }) => {
			const {
				gameTypes,
				selectedColor,
				selectedGameType,
				custom: customState,
			} = state;
			const CustomView = custom.view(state.custom, actions.custom);

			// todo close modal using esc key
			const toggle = (ev) => {
				ev.stopPropagation();
				toggleCreate();
				actions.reset()
			};
			const create = async (ev) => {
				if (state.attemptingSubmit || !showCreate) return;
				ev.stopPropagation();
				const random = Math.random() >= 0.5 ? 1 : 0;

				const {
					selectedOpp,
					customTimeSet,
					pinEnabled,
					pin,
					computerSkill,
					time,
				} = customState;
				const gameOptions = {
					selectedColor:
						selectedColor == "random"
							? ["white", "black"][random]
							: selectedColor,
					name: customTimeSet
						? "custom"
						: gameTypes[selectedGameType].name,
					time: customTimeSet
						? time
						: gameTypes[selectedGameType].time,
					selectedOpp,
					...(selectedOpp == "computer" ? { computerSkill } : {}),
					pinEnabled,
					pin,
				};

				try {
					actions.attemptSubmit();
					const { newRoom } = await Api.createRoom(gameOptions); // dont update room list with response, websocket message should be sent to update room list in lobby
					if (newRoom) toggleCreate();
					delay(300).then(actions.endAttempt).then(actions.reset);
				} catch (err) {
					console.log(err);
					// if (!err.hidden) actions.showError(err);
					delay(300).then(actions.endAttempt);
				}
			};

			function checkConnection() {
				if (!Api.isConnected()) Api.reconnect();
			}

			return (
				<div
					class={`${
						showCreate ? "" : "opacity-0 pointer-events-none"
					} create-wrapper modal fixed w-full h-full top-0 left-0`}
				>
					{showCreate && (
						<div
							oncreate={checkConnection}
							class="create flex items-center justify-center"
						>
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

function GameType({ type, selectGameType, selectedGameType }) {
	const capitalize = (s) => s && s[0].toUpperCase() + s.slice(1);
	return (
		<div
			onclick={() => selectGameType(type.id)}
			class={`cursor-pointer bg-green-200 py-2 rounded-md ${
				type.id == selectedGameType && "selected"
			}`}
			style="min-height:85px"
		>
			<div class="flex">
				<div class="w-2/3">
					<h2 class="text-base md:text-md lg:text-md px-4 whitespace-no-wrap text-gray-600">
						{capitalize(type.name)}
					</h2>
					{type.time && (
						<h3 class="text-base md:text-md lg:text-md px-8 py-2 text-gray-600">
							{type.time.minutes} min
						</h3>
					)}
				</div>
				<div class="w-1/3 flex justify-center items-center mr-2">
					<img
						src={`./assets/create/types/${type.name}.svg`}
						alt="game type"
					/>
				</div>
			</div>
		</div>
	);
}

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

function Footer({ create, toggle }) {
	return (
		<div
			onclick={debounce(create, 400)}
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


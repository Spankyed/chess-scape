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
		time: { minutes: "—", increment: "—" },
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
					const { newRoom } = await Api.createRoom(gameOptions); // dont update room list with response, websocket message will be sent to update lobby roomlist
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
				<div class={`create-wrapper modal ${ !showCreate && "hide-create"}`} >
					{showCreate && (
						<div oncreate={checkConnection} class="create">
							<div
								onclick={toggle}
								class="modal-overlay"
							></div>

							<div class="create-body">
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
								<div class="create-content">
									<div class="preset-types">
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
		<div class="choose-color">
			{colors.map((color) => (
				<div
					class={`piece-color ${
						color == selectedColor && "selected"
					}`}
				>
					<img
						id={`color-select-${color}`}
						onclick={(_) => selectColor(color)}
						src={`./assets/create/piece-${color}.svg`}
					/>
				</div>
			))}
		</div>
	);
}
function GameType({ type, selectGameType, selectedGameType }) {
	const capitalize = (s) => s && s[0].toUpperCase() + s.slice(1);
	return (
		<div
			onclick={() => selectGameType(type.id)}
			class={`type 
			${type.id == selectedGameType && "selected"} 
			${type.name != "forever" && "temp-disabled"}`}
			title={type.name != "forever" ? type.name : "Disabled"}
		>
			<div class="time">
				<h2 class="name">{capitalize(type.name)}</h2>
				{type.time && <h3 class="value">{type.time.minutes} min</h3>}
			</div>
			<img
				src={`./assets/create/types/${type.name}.svg`}
				alt="game type"
			/>
		</div>
	);
}
function Footer({ create, toggle }) {
	return (
		<div class="modal-footer">
			<button
				onclick={debounce(create, 400)}
				type="button"
				class="create"
			>
				Create Room
			</button>
			<button onclick={toggle} type="button" class="cancel">
				Cancel
			</button>
		</div>
	);
}


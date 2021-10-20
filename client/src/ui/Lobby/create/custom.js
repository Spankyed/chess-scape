import { h } from "hyperapp";

export default (initial) => ({
	state: {
		optionsOpen: false,
		time: { minutes: 15, increment: "3" },
		customTimeSet: false,
		isSelectingOpp: false,
		opponents: ["anyone", "angel", "computer"],
		selectedOpp: "anyone",
		computerSkill: "easy",
		pinEnabled: false,
		pin: null,
	},
	actions: {
		openCustomOptions: () => () => ({ optionsOpen: true }),
		ignoreCustomTime: () => () => ({ customTimeSet: false }),
		setTime:
			({ prop, value }) =>
			({ time }) => ({
				time: { ...time, [prop]: value },
				customTimeSet: prop && value && true,
			}),
		setComputerSkill: (computerSkill) => () => ({ computerSkill }),
		selectOpp: (selectedOpp) => () => ({
			selectedOpp,
			isSelectingOpp: false,
		}),
		toggleOppMenu:
			() =>
			({ isSelectingOpp }) => ({ isSelectingOpp: !isSelectingOpp }),
		togglePin:
			() =>
			({ pinEnabled, pin }) => ({
				pinEnabled: !pinEnabled,
				pin: !pinEnabled ? pin : null,
			}),
		setPin: (pin) => () => ({ pin }),
	},
	view:
		(state, actions) =>
		({ selectGameType, selectedGameType }) => {
			const {
				isSelectingOpp,
				pinEnabled,
				pin,
				opponents,
				selectedOpp,
				computerSkill,
				time,
				optionsOpen,
			} = state;
			const {
				selectOpp,
				toggleOppMenu,
				togglePin,
				setPin,
				setTime,
				setComputerSkill,
				openCustomOptions,
			} = actions;
			const type = { name: "Custom" };

			return (
				<div
					onclick={openCustomOptions}
					class={`custom ${selectedGameType == 4 && 'selected'}`}
				>
					{!optionsOpen ? (
						<div class="flex px-3 justify-center">
							<img
								class="flex-shrink h-10"
								src="./assets/create/types/custom.svg"
							/>
							<h2 class="w-1/3 mb-3 lg:text-base md:text-md lg:text-md px-4 whitespace-no-wrap text-gray-600">
								{type.name}
							</h2>
						</div>
					) : (
						<div class="flex flex-col px-3">
							<h2 class="w-full mb-3 lg:text-base md:text-md lg:text-md px-4 whitespace-no-wrap text-gray-600">
								{type.name}
							</h2>
							<div class="line-1 flex items-center justify-center w-full mb-2">
								<div class="flex items-center justify-center w-full">
									<TimeControl
										{...{
											setTime,
											time,
											selectGameType,
											selectedGameType,
										}}
									/>
								</div>
							</div>
							{/* todo dropdown icon here to show more options */}
							<OpponentSelect
								{...{
									isSelectingOpp,
									selectedOpp,
									toggleOppMenu,
									opponents,
									selectOpp,
									computerSkill,
									setComputerSkill,
								}}
							/>
							<PinProtect
								{...{ setPin, togglePin, pinEnabled, pin }}
							/>
						</div>
					)}
				</div>
			);
		},
});

function TimeControl({ setTime, time, selectGameType, selectedGameType }) {
	const formatTimeMutate = (target) => {
		return (target.value = Number(
			target.value
				.toString()
				.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "")
				.substring(0, 2)
		));
	};

	const handleTimeInput = (prop) => ({target}) => {
		if (selectedGameType != 4) selectGameType(4); // set game type to custom when custom time inputted
		setTime({
			prop,
			value: formatTimeMutate(target),
		});
	}

	return (
		<div class="control shadow-md relative flex">
			<span class="ml-2 pl-3 flex items-center pointer-events-none w-12">
				<img class="" src="./assets/controls/clock.svg" />
			</span>
			<div class="minutes-input">
				<label for="time" class="sr-only">
					time
				</label>
				<input
					oninput={handleTimeInput("minutes")}
					type="number"
					min="0"
					max="60"
					step="1"
					name="time"
					id="time"
					value={time.minutes}
					class="focus:ring-indigo-500 focus:border-indigo-500 pl-7 bg-transparent"
					placeholder="15"
				/>
				<div class="minutes-suffix pointer-events-none">min</div>
			</div>
			<div class="ctrl-secondary w-1/4 pl-2">
				<label for="increment" class="sr-only">
					increment
				</label>
				<div class="relative w-full h-full">
					<span
						class="absolute h-full text-center flex justify-center items-center"
						style="left: -3px;"
					>
						+
					</span>
					<select
						onchange={handleTimeInput("increment")}
						value={time.increment}
						id="increment"
						name="increment"
						class="increment focus:ring-indigo-500 focus:border-indigo-500 h-full py-0 px-3 bg-transparent"
						style="margin-left: -10px;"
					>
						<option value="1">1 sec</option>
						<option value="3">3 sec</option>
						<option value="10">10 sec</option>
						<option value="30">30 sec</option>
					</select>
				</div>
			</div>
		</div>
	);
}

function OpponentSelect({
	isSelectingOpp,
	selectedOpp,
	toggleOppMenu,
	opponents,
	selectOpp,
	computerSkill,
	setComputerSkill,
}) {
	return (
		<div class="">
			{/* {true ? ( */}
			{isSelectingOpp ? (
				<OpponentMenu
					{...{
						opponents,
						selectOpp,
						selectedOpp,
						computerSkill,
						setComputerSkill,
					}}
				/>
			) : (
				<SelectedOpponent {...{ selectedOpp, toggleOppMenu }} />
			)}
		</div>
	);
}

function SelectedOpponent({ selectedOpp, toggleOppMenu }) {
	const capitalize = (s) => s && s[0].toUpperCase() + s.slice(1);
	return (
		<div
			onclick={toggleOppMenu}
			class="cursor-pointer opp-option-wrapper control mb-3 justify-center"
		>
			<div class="w-3/4 flex justify-between mx-auto">
				<span class="text-left pl-2">VS</span>
				<img
					class="w-8 "
					src={`./assets/create/custom/${selectedOpp}.svg`}
				/>
				<span class="text-left pl-2">{capitalize(selectedOpp)}</span>
				{/* todo add dropdown arrow here */}
			</div>
		</div>
	);
}

function OpponentMenu({
	opponents,
	selectOpp,
	selectedOpp,
	computerSkill,
	setComputerSkill,
}) {
	return (
		<div class="w-full">
			{opponents.map((option) => (
				<div
					class={`opp-option-wrapper opp-option control mb-3 ${
						option == selectedOpp && "selected"
					}`}
				>
					<div
						onclick={() => selectOpp(option)}
						class="w-3/4 pl-4 flex items-center justify-center"
					>
						<OpponentOption opponent={option} />
					</div>
					{option === "computer" && (
						<ComputerSkillMenu
							{...{ computerSkill, setComputerSkill }}
						/>
					)}
				</div>
			))}
		</div>
	);
}
function OpponentOption({ opponent }) {
	const capitalize = (string) =>
		string.charAt(0).toUpperCase() + string.slice(1);
	return (
		<div class="w-full flex pl-1 cursor-pointer">
			<img class="w-8" src={`./assets/create/custom/${opponent}.svg`} />
			<span class="w-1/8 mx-2 text-lg text-center">vs</span>
			<span class="text-left pl-2">{capitalize(opponent)}</span>
		</div>
	);
}

function ComputerSkillMenu({ computerSkill,  setComputerSkill }) {
	return (
		<div class="computer-skill-menu ctrl-secondary absolute inset-y-0 right-0 flex items-center w-1/4">
			<label for="difficulty" class="sr-only">
				computer difficulty
			</label>
			<select
				onchange={({ target }) =>
					setComputerSkill(target.value)
				}
				value={computerSkill}
				id="difficulty"
				name="difficulty"
				class="mr-3 focus:ring-indigo-500 
				focus:border-indigo-500 h-full py-0 px-2 pr-3"
				// focus:border-indigo-500 h-full py-0 pl-2 pr-1 bg-transparent"
			>
				<option value="random">Rando</option>
				<option value="easy"> Easy </option>
				<option value="hard">Hard</option>
				<option value="doom">D00M</option>
			</select>
		</div>
	);
}

function PinProtect({ setPin, togglePin, pinEnabled, pin }) {
	return (
		<div class="pin-protect control line-3 flex mt-2 w-full text-center relative">
			<div class="pl-6">
				<label class="flex text-center mx-auto justify-center sr-only">
					Require pin
				</label>
				<input
					type="checkbox"
					class="form-checkbox h-5 w-5 mt-4"
					onchange={togglePin}
					checked={pinEnabled}
				/>
			</div>
			<div class="ml-4">Require Pin</div>
			<div class="ctrl-secondary pin-wrapper w-1/4 absolute inset-y-0 right-0 flex items-center">
				<span class="w-4 ml-2 leading-snug font-normal absolute text-center text-blueGray-300 bg-transparent justify-center">
					<img
						class="lock w-full h-full"
						src="./assets/create/custom/lock.svg"
					/>
					<i class="fas fa-lock"></i>
				</span>
				<input
					oninput={(e) => setPin(e.target.value)}
					value={pin}
					type="text"
					pattern="\d*"
					maxlength="4"
					class="ml-6 pl-1 pin form-input w-full h-full"
					placeholder="Pin"
					disabled={!pinEnabled}
				></input>
			</div>
		</div>
	);
}

export { Custom };

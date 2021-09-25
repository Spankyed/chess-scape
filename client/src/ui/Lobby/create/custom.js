import { h } from "hyperapp";

function Custom({ selectGameType, setCustomProp, customType }) {
	const type = {
		id: 4,
		name: "Custom",
		time: "— —",
		src: `./assets/create/custom/custom.svg`,
	};
	return (
		<div
			onclick={() => selectGameType(type.id)}
			class="custom bg-green-200 px-2 pb-2 rounded-md mt-5"
		>
			<div class="flex flex-col px-3">
				<h2 class="w-full mb-3 lg:text-base md:text-md lg:text-md px-4 whitespace-no-wrap text-gray-600">
					{type.name}
				</h2>
				<div class="line-1 flex items-center justify-center w-full mb-2">
					<div class="flex items-center justify-center w-full">
						<TimeControl {...{ setCustomProp, customType }} />
					</div>
				</div>
				{/* todo dropdown icon here to show more options */}
				<OpponentSelect />
				<PinProtect />
			</div>
		</div>
	);
}

function TimeControl({ setCustomProp, customType }) {
	console.log("minutes: ", customType.minutes);
	const formatTime = (target) => {
		target.value = Number(
			target.value
				.toString()
				.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "")
				.substring(0, 2)
		);
	};
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
					oninput={({ target }) => formatTime(target)}
					type="number"
					min="0"
					max="60"
					step="1"
					name="time"
					id="time"
					value={15}
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
						id="increment"
						name="increment"
						class="increment focus:ring-indigo-500 focus:border-indigo-500 h-full py-0 px-3 bg-transparent"
						style="margin-left: -10px;"
					>
						<option>1 sec</option>
						<option selected>3 sec</option>
						<option>10 sec</option>
						<option>30 sec</option>
					</select>
				</div>
			</div>
		</div>
	);
}

function OpponentSelect({ toggleMenu }) {
	return (
		<div class="">
			{/* {true ? ( */}
			{false ? (
				<SelectedOpponent {...{ toggleMenu }} />
			) : (
				<OpponentMenu {...{ toggleMenu }} />
			)}
		</div>
	);
}

function SelectedOpponent({ opp }) {
	const opponent = { who: "angel" };
	const capitalize = (string) =>
		string.charAt(0).toUpperCase() + string.slice(1);
	return (
		<div class="opp-option-wrapper control mb-3 justify-center selected">
			<div class="w-3/4 flex justify-between mx-auto">
				<span class="text-left pl-2">VS</span>
				<img
					class="w-8 "
					src={`./assets/create/custom/${opponent.who}.svg`}
				/>
				<span class="text-left pl-2">{capitalize(opponent.who)}</span>
				{/* todo add dropdown arrow here */}
			</div>
		</div>
	);
}

function OpponentMenu() {
	const options = [{ who: "anyone" }, { who: "angel" }, { who: "computer" }];
	return (
		<div class="w-full">
			{options.map((option, idx) => (
				<div
					class={`opp-option-wrapper control mb-3 ${
						idx == 1 && "selected"
					}`}
				>
					<div class="w-3/4 pl-4 flex items-center justify-center">
						<OpponentOption opponent={option} />
					</div>
					{option.who === "computer" && <ComputerSkillMenu />}
				</div>
			))}
		</div>
	);
}
function OpponentOption({ opponent }) {
	const capitalize = (string) =>
		string.charAt(0).toUpperCase() + string.slice(1);
	return (
		<div class="w-full flex pl-1">
			<img
				class="w-8"
				src={`./assets/create/custom/${opponent.who}.svg`}
			/>
			<span class="w-1/8 mx-2 text-lg text-center">vs</span>
			<span class="text-left pl-2">{capitalize(opponent.who)}</span>
		</div>
	);
}

function ComputerSkillMenu() {
	return (
		<div class="computer-skill-menu ctrl-secondary absolute inset-y-0 right-0 flex items-center w-1/4">
			<label for="difficulty" class="sr-only">
				computer difficulty
			</label>
			<select
				id="difficulty"
				name="difficulty"
				class="mr-3 focus:ring-indigo-500 
				focus:border-indigo-500 h-full py-0 px-2 pr-3"
				// focus:border-indigo-500 h-full py-0 pl-2 pr-1 bg-transparent"
			>
				<option>Rando</option>
				<option selected>Easy</option>
				<option>Hard</option>
				<option>D00M</option>
			</select>
		</div>
	);
}

function PinProtect() {
	// comp-skill-sel absolute inset-y-0 right-0 flex items-center w-3/12
	return (
		<div class="pin-protect control line-3 flex mt-2 w-full text-center relative">
			<div class="pl-6">
				<label class="flex text-center mx-auto justify-center sr-only">
					Require pin
				</label>
				<input type="checkbox" class="form-checkbox h-5 w-5 mt-4" />
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
					type="text"
					pattern="\d*"
					maxlength="4"
					class="ml-6 pl-1 pin form-input w-full h-full"
					placeholder="Pin"
				></input>
			</div>
		</div>
	);
}

export { Custom };

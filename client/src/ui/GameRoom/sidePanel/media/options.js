import { h } from 'hyperapp';

export default (initial) => ({
	state: {
		autoPlay: true,
		allowShare: true,
		persistShareSetting: false, // if false prompts user every time song is shared
	},
	actions: {
		setShare:
			({ bool, persist }) =>
			(state) => ({ allowShare: bool, persistShareSetting: persist }),
		toggle: (option) => (state) => ({ [option]: !state[option] }),
	},
	// view: (state, {showMedia,...actions}) => () => {
	view:
		({ allowShare, autoPlay }, { toggle }) =>
		({ type }) => {
			const options = [
				{ text: "Share", name: "allowShare", value: allowShare },
				{ text: "Auto-Play", name: "autoPlay", value: autoPlay },
			];

			return (
				<div class="options">
					{options.map((option) => (
						<div
							class="toggle-wrapper"
							title={
								option.text == "Share"
									? `Allow ${type} sharing with room`
									: `Auto-play ${type} in queue`
							}
						>
							<span class="toggle-text"> {option.text} </span>
							<Toggle {...{ option, toggle }} />
						</div>
					))}
				</div>
			);
		},
});

function Toggle({ option, toggle }) {
	return (
		<div class="toggle">
			<input
				oncreate={(el) => (el.checked = option.value)}
				onchange={(_) => toggle(option.name)}
				class="tgl-input"
				// checked={option.value}
				id={option.name}
				name={option.name}
				type="checkbox"
			/>
			<label class="tgl-btn" for={option.name}></label>
		</div>
	);
}

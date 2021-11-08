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
						<div class="option-item">
							<label
								for={option.id}
								class="toggle-wrapper"
								title={
									option.text == "Share"
										? `Allow ${type} sharing with room`
										: `Auto-play ${type} in queue`
								}
							>
								<span class="toggle-text"> {option.text} </span>
								<div class="toggle">
									<input
										onchange={(_) => toggle(option.name)}
										checked={option.value}
										id={option.id}
										type="checkbox"
									/>
									<div
										class={`line ${
											option.value && "checked"
										}`}
									></div>
									<div class="dot"></div>
								</div>
							</label>
						</div>
					))}
				</div>
			);
		},
});


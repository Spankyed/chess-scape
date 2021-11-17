import { h } from 'hyperapp';
// import Api from '../../api/Api';
import Commands from './Commands';
import { nanoid } from 'nanoid/non-secure'

export default (initial) => ({
	state: {
		consoleOpen: false,
		executing: false,
		input: "",
		entries: {},
	},
	actions: {
		addEntry:
			({ id, command }) =>
			(state) => ({
				entries: {
					...state.entries,
					[id]: { command },
				},
			}),
		addEntryResponse:
			({ id, response }) =>
			({entries}) => ({
				entries: {
					...entries,
					[id]: { ...entries[id], response },
				},
			}),
		setInput: (e) => ({ input: e.target.value }),
		attemptExec: () => ({ executing: true }),
		endExec: () => ({ executing: false }),
		resetInput: () => ({ input: "" }),
		toggle: (val) => (state) => ({
			consoleOpen: "boolean" === typeof val ? val : !state.consoleOpen,
		}),
	},
	view:
		(state, actions) =>
		({ actions: appActions, state: appState }) => {
			// console.log("admin state: ", { isAuthorized, inGame, lobby });
			const execute = (e) => {
				e.preventDefault();
				if (state.executing) return;
				actions.resetInput();
				actions.attemptExec();
				const input = state.input;
				const [command, ...args] = (input && input.split(" ")) || [];
				const executor = Commands[command];
				// console.log("executor: ", executor);
				if (executor) {
					const id = nanoid();
					actions.addEntry({ id, command });
					executor({ state: appState, actions: appActions, args })
						.then((response) => {
							actions.addEntryResponse({ id, response });
							actions.endExec();
						})
						.catch((err) => {
							actions.addEntryResponse({
								id,
								response: { message: err.message, error: true },
							});
							actions.endExec();
							console.error(err);
						});
				} else actions.endExec();
			};
			return (
				<div class="admin no-pointers">
					{!state.consoleOpen ? (
						<span
							class="open-console"
							ondblclick={() => actions.toggle(true)}
						></span>
					) : (
						<div
							class="command-console"
							onclick={() => actions.toggle(false)}
						>
							<div class="command-output">
								{Object.values(state.entries).map((entry) => (
									<Entry {...{ entry }} />
								))}
							</div>
							<form
								class="command-input-wrapper"
								onsubmit={execute}
							>
								<Chevron />
								<input
									onclick={(e) => e.stopPropagation()}
									class="command-input"
									autofocus="autofocus"
									placeholder="Enter Command"
									oninput={actions.setInput}
									value={state.input}
								/>
							</form>
						</div>
					)}
				</div>
			);
		},
});


function Entry({entry}) {
	return (
		<div class="entry-wrapper">
			<div class="entry command">
				<Chevron />
				{entry.command}
			</div>
			{entry.response ? (
				<div
					class={`entry ${
						entry.response.error ? "error" : "success"
					}`}
				>
					{entry.response.message}
				</div>
			) : (
				<div class="entry exec">. . .</div>
			)}
		</div>
	);
}


function Chevron() {
	return (
		<span class="input-chevron">
			<svg width="1em" height="1em" viewBox="0 0 16 16">
				<path
					d="M6,4L10,8L6,12"
					fill="none"
					stroke="currentColor"
					stroke-width="1.5"
					stroke-linecap="round"
				></path>
			</svg>
		</span>
	);
}
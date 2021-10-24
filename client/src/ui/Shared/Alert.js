import { h } from 'hyperapp';
import { nanoid } from 'nanoid/non-secure'
import { delay } from "nanodelay";
import debounce from "tiny-debounce";

/*
{
	options: {
		position: 'top',
		actions: {confirm:{}, default:{}}
		showDAG: true, // show Don't ask again checkbox
		dontAskAgain: true
	},
}
*/
export default (initial) => ({
	state: {
		alerts: {},
	},
	actions: {
		show:
			(options) =>
			({ alerts }, actions) => {
				if (options.time) delay(options.time).then((_) => actions.close({ id: options.id }));
				return {
					alerts: {
						...alerts,
						[options.id || nanoid()]: {
							...options,
							showDAG: typeof options?.dontAskAgain === "boolean",
						},
					},
				};
			},
		closeAll: () => () => ({ alerts: {} }),
		closeSome: (some) => (_,{close}) => {
			some.forEach(([id, completed]) => close({ id, completed }));
		},
		close:
			({id, completed}) =>
			({ alerts }) => {
				if (!alerts[id]) return;
				if (!completed)
					alerts[id].actions?.["default"].handler(
						false,
						alerts[id].dontAskAgain
					);
				let { [id]: removed, ...rest } = alerts;
				return { alerts: { ...rest } };
			},
		toggleAskAgain:
			(id) =>
			({ alerts }) => ({
				alerts: {
					...alerts,
					[id]: {
						...alerts[id],
						dontAskAgain: !alerts[id].dontAskAgain,
					},
				},
			}),
	},
	view: ({ alerts }, actions) => () => {
		return (
			<div class="alert-wrapper h-full absolute top-0 w-full">
				{Object.entries(alerts).map(([id, alert]) => (
					<Alert {...{ actions, id, alert }} />
				))}
			</div>
		);
	},
	hostAlert: {
		// icon: "./assets/create/host.svg",
		id: "host",
		role: "none",
		heading: "Room Host",
		message: "Waiting for a player to join your room.",
		// actions: {
		// 	default: {
		// 		text: "Abort",
		// 		handler: (_) => {
		// 			Api.deleteRoom(state.hostedRoom);
		// 		},
		// 	},
		// },
	},
	startAlert: {
		// icon: "./assets/create/host.svg",
		id: "start",
		role: "none",
		heading: "Both Players Joined",
		message: "The match will begin shortly.",
		// time: 2500
	},
});

function Alert({id, alert, actions}){
		let { close, toggleAskAgain } = actions
		const handleAction = type => _ => {
			const result = type == 'confirm'
			alert.actions?.[type].handler(result, alert.dontAskAgain)
			close({id, completed:true})
		}
		return (
			<div class={`alert ${alert.role} mx-auto flex-row justify-between`}>
				{alert.icon && (
					<div class="alert-icon flex items-center bg-blue-100 border-r border-blue-500 justify-center w-20 flex-shrink-0">
						<span class="text-blue-500 px-3 h-full">
							<img
								class="alert-icon-img h-full"
								src={alert.icon}
							/>
						</span>
					</div>
				)}
				<div class="alert-text m-2 mx-2 md:mx-4 flex-grow relative">
					<div class="alert-title text-gray-200">
						{alert.heading}
					</div>
					<div class="alert-message ">{alert.message}</div>
					{alert.showDAG && (
						<label class="flex items-center absolute right-0 top-0 text-sm text-gray-500">
							<input
								onchange={toggleAskAgain}
								checked={alert.dontAskAgain}
								class="form-checkbox"
								type="checkbox"
							/>
							<span class="md:hidden ml-1">Remember</span>
							<span class="hidden md:inline ml-2">
								Don't ask again
							</span>
						</label>
					)}
				</div>
				{alert.actions && (
					<div class="alert-options flex-shrink flex flex-col font-semibold">
						{alert.actions.confirm && (
							<button
								onclick={debounce(handleAction("confirm"), 300)}
								class="alert-button text-blue-800 p-1 px-4"
							>
								{alert.actions.confirm.text}
							</button>
						)}
						{alert.actions.default && (
							<button
								onclick={debounce(handleAction("default"), 300)}
								class="alert-button text-gray-800 p-1 px-4"
							>
								{alert.actions.default.text}
							</button>
						)}
					</div>
				)}
			</div>
		);
}
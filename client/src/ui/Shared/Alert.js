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
			<div class="alert-wrapper">
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
		const shouldCenter = !alert.actions && !alert.icon
		return (
			<div class={`alert ${alert.role}`}>
				{alert.icon && (
					<div class="alert-icon">
						<img src={alert.icon} />
					</div>
				)}
				<div class={`alert-text ${shouldCenter && "center"}`}>
					<div class="alert-title">{alert.heading}</div>
					<div class="alert-message">{alert.message}</div>
					{alert.showDAG && (
						<div class="DAG">
							<input
								onchange={toggleAskAgain}
								checked={alert.dontAskAgain}
								class="form-checkbox"
								type="checkbox"
							/>
							<span class="remember">Remember</span>
							<span class="dont-ask">Don't ask again</span>
						</div>
					)}
				</div>
				{alert.actions && (
					<div class="alert-options">
						{alert.actions.confirm && (
							<button
								onclick={debounce(handleAction("confirm"), 300)}
								class="alert-button"
							>
								{alert.actions.confirm.text}
							</button>
						)}
						{alert.actions.default && (
							<button
								onclick={debounce(handleAction("default"), 300)}
								class="alert-button default"
							>
								{alert.actions.default.text}
							</button>
						)}
					</div>
				)}
			</div>
		);
}
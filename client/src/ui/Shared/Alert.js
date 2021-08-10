import { h } from 'hyperapp';

export default initial => ({
	state: { 
		isVisible: false,
		options: {
			position: 'top',
			// actions: {positive:{}, negative:{}}
			// dontAskAgain: true
		},
		showDAG: true, // show Don't ask again checkbox
	},
	actions: { 
		show: options => state => ({
			isVisible: true, 
			showDAG: typeof options.dontAskAgain === 'boolean', 
			options
		}),
		hide: _ => _ => ({isVisible: false}),
		toggleAskAgain: _ => state => ({options: {...state.options, dontAskAgain: !state.options.dontAskAgain}})
	},
	view: (state, actions) => ({gameId, leaveGame}) => { 
		// todo: reset state ondestroy
		const handleAction = type => _ => {
			actions.hide()
			const result = type == 'positive' ? true : false
			state.options.actions?.[type].handler(result, state.options.dontAskAgain)
		}
		return ( 
		<div class="alert-wrapper h-full absolute top-0 w-full">
		{	
		<div class={`alert info mx-auto flex-row justify-between ${!state.isVisible && 'hidden'}`}>
			<div class="alert-icon flex items-center bg-blue-100 border-r border-blue-500 justify-center w-20 flex-shrink-0">
				<span class="text-blue-500 p-3">
					<svg height="100%" version="1.1" viewBox="0 0 68 48" width="100%"><path d="M66.52,7.74c-0.78-2.93-2.49-5.41-5.42-6.19C55.79,.13,34,0,34,0S12.21,.13,6.9,1.55 C3.97,2.33,2.27,4.81,1.48,7.74C0.06,13.05,0,24,0,24s0.06,10.95,1.48,16.26c0.78,2.93,2.49,5.41,5.42,6.19 C12.21,47.87,34,48,34,48s21.79-0.13,27.1-1.55c2.93-0.78,4.64-3.26,5.42-6.19C67.94,34.95,68,24,68,24S67.94,13.05,66.52,7.74z" fill="#FF0000"></path><path d="M 45,24 27,14 27,34" fill="#fff"></path></svg>
				</span>
			</div>
			<div class="alert-text m-2 mx-4 flex-grow relative">
				<div class="alert-title font-semibold text-gray-800">
					{state.options.heading}
				</div>
				<div class="alert-message ">
					{state.options.message}
				</div>
				{	state.showDAG &&
					<label class="flex items-center absolute right-0 top-0 text-sm text-gray-500">
						<input onchange={actions.toggleAskAgain} checked={state.options.dontAskAgain} class="form-checkbox" type="checkbox"/>
						<span class="ml-2">Don't ask again</span>
					</label> 
				}
			</div>
			{	state.options.actions && 
				<div class="alert-options flex-shrink flex flex-col font-semibold">
					<button onclick={handleAction('positive')} class="alert-button text-blue-800 p-1 px-4">
						{state.options.actions?.positive.text}
					</button>
					{/* <button class="alert-button text-green-800 p-1">
						Allow Always
					</button> */}
					<button onclick={handleAction('negative')} class="alert-button text-gray-800 p-1 px-4">
						{state.options.actions?.negative.text}
					</button>
					{/* <button class="alert-button text-red-800 p-1">
						Disable
					</button> */}
				</div>
			}
		</div>
		}
		</div>
		)
	}
})


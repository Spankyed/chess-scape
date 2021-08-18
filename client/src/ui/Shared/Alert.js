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
	view: ({options, isVisible, showDAG}, actions) => ({gameId, leaveGame}) => { 
		// todo: reset state ondestroy
		const handleAction = type => _ => {
			actions.hide()
			const result = type == 'positive' ? true : false
			options.actions?.[type].handler(result, options.dontAskAgain)
		}
		return ( 
		<div class="alert-wrapper h-full absolute top-0 w-full">
		{	
		<div class={`alert info mx-auto flex-row justify-between ${!isVisible && 'hidden'}`}>
			<div class="alert-icon flex items-center bg-blue-100 border-r border-blue-500 justify-center w-20 flex-shrink-0">
				<span class="text-blue-500 p-3 h-full">
					<img class="alert-icon-img h-full" src={options.icon}/> 
				</span>
			</div>
			<div class="alert-text m-2 mx-4 flex-grow relative">
				<div class="alert-title font-semibold text-gray-800">
					{options.heading}
				</div>
				<div class="alert-message ">
					{options.message}
				</div>
				{	showDAG &&
					<label class="flex items-center absolute right-0 top-0 text-sm text-gray-500">
						<input onchange={actions.toggleAskAgain} checked={options.dontAskAgain} class="form-checkbox" type="checkbox"/>
						<span class="ml-2">Don't ask again</span>
					</label> 
				}
			</div>
			{	options.actions && 
				<div class="alert-options flex-shrink flex flex-col font-semibold">
					<button onclick={handleAction('positive')} class="alert-button text-blue-800 p-1 px-4">
						{options.actions?.positive.text}
					</button>
					{/* <button class="alert-button text-green-800 p-1">
						Allow Always
					</button> */}
					<button onclick={handleAction('negative')} class="alert-button text-gray-800 p-1 px-4">
						{options.actions?.negative.text}
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


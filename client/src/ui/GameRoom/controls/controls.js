import { h } from 'hyperapp';

export default initial => ({
	state: { 
		isLoading: true,
		chatting: false
	},

	actions: { 
		displayLoadingUI: () => () => ({isLoading: true}),
		hideLoadingUI: () => () => ({isLoading: false})
	},
	view: (state, actions) => ({isLoading , toggleChat}) => {
		return ( 
			<div class={`${isLoading && 'hidden'} absolute top-0 left-0 w-full h-full pointer-events-none`} style="z-index:999;">
				<div class="relative w-full h-full">

					<div class="w-full flex"> 
						<div class="px-3 w-56">
							<Challenger/>
						</div>
						<div class="match-message mx-auto text-center justify-center items-center">
							<MatchMessage/>
						</div>
						<div class="px-3 w-56">
							<Opponent/>
						</div>
					</div>
					<div class="absolute left-0 bottom-0 p-5">
						<button class="
							bg-gray-600  text-white active:bg-pink-600 font-bold uppercase text-xs px-4 py-2 rounded shadow hover:shadow-md outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-150
						">
							<img class="h-12" src="./assets/controls/back.svg"></img>
						</button>
					</div>
					<div class="absolute right-0 bottom-0 p-5 flex flex-row flex-wrap">
						<button class="
							bg-gray-600  text-white active:bg-pink-600 font-bold uppercase text-xs px-4 py-2 rounded shadow hover:shadow-md outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-150
						">
							<img class="h-12" src="./assets/controls/menu.svg"></img>
						</button>
						<button onclick={toggleChat} class="
							bg-gray-600  text-white active:bg-pink-600 font-bold uppercase text-xs px-4 py-2 rounded shadow hover:shadow-md outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-150
						">
							<img class="h-12" src="./assets/controls/chat.svg"></img>
						</button>
					</div>
				</div>
			</div>
		)
	}
})

function Challenger(){
	return (
		<div class="mt-2 rounded-md shadow-lg bg-gray-600 w-full flex flex-row flex-wrap p-2 antialiased">
			<div class="md:w-1/3 w-full">
				<img style="height: 64px;" class="rounded-sm shadow-lg antialiased" src="https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png"/>  
			</div>
			<div class="md:w-2/3 w-full flex flex-row flex-wrap">
				<div class=" pl-1 w-full text-left text-gray-700 font-semibold relative pt-3 md:pt-0">
					<div class="text-2xl text-white leading-tight">John Doe</div>
					<div class="clock flex rounded-sm">
						<img class="pl-3 p-1 inline h-8" src="./assets/controls/clock.svg"></img>
						<span class="text-xl w-full text-center justify-center items-center">10:00</span>
					</div>
					{/* <div class="text-normal text-gray-300 hover:text-gray-400 cursor-pointer"><span class="border-b border-dashed border-gray-500 pb-1">Administrator</span></div> */}
					{/* <div class="text-sm text-gray-300 hover:text-gray-400 cursor-pointer md:absolute pt-3 md:pt-0 bottom-0 right-0">Last Seen: <b>2 days ago</b></div> */}
				</div>
			</div>
		</div>
	)
}
function Opponent(){
	return (
		<div class="mt-2 rounded-md shadow-lg bg-gray-600 w-full flex flex-row flex-wrap p-2 antialiased">

			<div class="md:w-2/3 w-full flex flex-row flex-wrap">
				<div class=" pr-1 w-full text-right text-gray-700 font-semibold relative pt-3 md:pt-0">
					<div class="text-2xl text-white leading-tight">Jane Doe</div>
					<div class="clock flex rounded-sm">
						<span class="text-xl w-full text-center justify-center items-center">10:00</span>
						<img class="pl-3 p-1 inline h-8" src="./assets/controls/clock.svg"></img>
					</div>
					{/* <div class="text-normal text-gray-300 hover:text-gray-400 cursor-pointer"><span class="border-b border-dashed border-gray-500 pb-1">Administrator</span></div> */}
					{/* <div class="text-sm text-gray-300 hover:text-gray-400 cursor-pointer md:absolute pt-3 md:pt-0 bottom-0 right-0">Last Seen: <b>2 days ago</b></div> */}
				</div>
			</div>
			<div class="md:w-1/3 w-full">
				<img style="height: 64px;" class="rounded-sm shadow-lg antialiased" src="https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png"/>  
			</div>
		</div>
	)
}

function MatchMessage(){
	return (
		<div class="messages">
			{/* <!-- Message 2 --> */}
			<div id="topic-1" class="message-topic">MATCH</div>
			<div id="message-1" class="message-content">
				<span>White is Victorious</span>
			</div>
		</div>
	)
}
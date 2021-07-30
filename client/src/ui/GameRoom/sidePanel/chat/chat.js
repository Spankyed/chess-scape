import { h } from 'hyperapp';
import Api from '../../../../api/Api';
import { nanoid } from 'nanoid/non-secure'

export default initial => ({
	state: { 
		// message: '',
		messages: [{
			user: 'Kathie M.',
			text: `Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book.`,
			img: 'https://www.w3schools.com//w3images/avatar_g2.jpg',
			time: '11:30'
		},{
			user: 'Angel S.',
			text: `Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book.`,
			img: 'https://www.w3schools.com//w3images/bandmember.jpg',
			time: '11:26'
		}],
	},

	actions: { 
		addMessage: message => state => ({ messages: [...state.messages, message] }),
		// modify: (value) => value
	},

	view: (state, actions) => ({}) => {
		var { messages } = state;
		function init() {
			console.log('showing chat')
			// Api.getChat(function() {});
			Api.setMessageHandlers({
				chat: (msg) => console.log('some1 chatted', msg)
			})
		}

		var keys = {}
		var handleKeyPress = (evt) => {
			// console.log('keypress event',evt)
			let { keyCode, type } = evt || Event; // to deal with IE
			if(keyCode != 13 && keyCode != 16) return
			let isKeyDown = (type == 'keydown')
			keys[keyCode] = isKeyDown;
			// if key down event & enter key is pressed down & shift isn't currently being pressed down 
			if(isKeyDown && keys[13] && !keys[16]){
				let message = evt.target.value
				// console.log('evt.target',evt.target)
				message = { text: message, user: 'Kathie M.', img: 'https://www.w3schools.com//w3images/avatar_g2.jpg',time: '11:26'}
				actions.addMessage(message) 
				setTimeout(_=> evt.target.value = "", 0)
				// Api.sendChat(message)
				// actions.modify({ message: '' })
				// scrollBottom();
			}
			return null;
		};

		return (
			// root el needs key to fix grammarly breaking textarea
			<div oncreate={init} class="h-full" key={ nanoid() }> 
				<div class="chat-window flex flex-col items-end" style="overflow-anchor: none;">
					<ul class="w-full">
					{	messages.map((message, i) => 
							<Message message={message}/>
						)
					}
					</ul>
				</div>
				<div class="chat-footer bg-gray-600">
					<div class="input-wrapper">
						<textarea class="resize-none w-full px-3 py-1 text-gray-700 border rounded-sm focus:outline-none" rows="2" autocomplete="off"
							placeholder="Type here and press enter"
							onkeyup={handleKeyPress}
							onkeydown={handleKeyPress}
							style="white-space: pre-wrap;overflow-wrap: break-word;"
							// oninput={e => actions.modify({ message: e.target.value })} 
							// value={state.message}
						/>
						{/* <input class="chat-input" id="chat" placeholder="Type here and press enter" autocomplete="off"
								onkeyup={e => (e.keyCode === 13 ? add(e) : null)}
							/> */}
					</div>
				</div>
			</div>

		);
	}
})

function scrollBottom(){
	let chatWindow = $('.chat-window')
	chatWindow.animate({ scrollTop: chatWindow.prop('scrollHeight') }, 1000);
}


function Message({message}){
	return (
		<li class="message flex justify-between items-center mt-3 text-lg transition">
			<div class="flex ml-1"> 
				<img src={message.img} width="40" height="40" class="rounded-md mt-2"/>
				<div class="flex flex-row flex-wrap ml-2"> 
					<div class="w-full">
						<span class="font-medium text-black">{message.user}</span> 
						<span class="text-sm text-gray-300 pl-2">{message.time}</span>
					</div>
					<span class="text-gray-200 text-gray-800" style="word-break: break-word;"> {message.text} </span> 
				</div>
			</div>
		</li>
		// <div class="container dark">
		// 	<img src={ message.user ? "https://www.w3schools.com//w3images/avatar_g2.jpg" : "https://www.w3schools.com//w3images/bandmember.jpg" } alt="Avatar" class={ message.user ? "right" : "" }/>
		// 	<p>{message.text}</p>
		// </div> 
	)
}

import { h } from 'hyperapp';
import Api from '../../../api/Api';

export default initial => ({
	state: { 
		messages: [{
			img: '',
			username: 'Kathie',
			text: 'Hello World'
		},{
			img: '',
			username: 'Kathie',
			text: 'Hello Worldss'
		}],
	},

	actions: { 
		addMessage: message => state => ({ messages: [...state.messages, message] }),
	},

	view: (state, actions) => ({gameId, leaveGame}) => {
		var { messages } = state;
		
		function init() {
			console.log('showing chat')
			// Api.getChat(function() {});
			Api.setMessageHandlers({
				chat: (msg) => console.log('some1 chatted', msg)
			})
		}

		var add = (evt) => {
			let message = evt.target.value
			if (typeof(message) !== undefined && message !== ''){ // todo: better validation
				message = { text: message, user: true}
				actions.addMessage(message) 
				// Api.sendChat(message)
				scrollBottom();
			}
		};
		
		return (
			<div oncreate={init} class="h-full w-1/4">
				<div class="chat-window flex flex-col-reverse items-end">
				{	messages.slice(0).reverse().map((message, i) => 
						<Message message={message}/>
					)
				}
				</div>
				<div class="chat-footer clearfix">
					<div class="input-wrapper">
						<input class="chat-input" id="chat" placeholder="Type here and press enter" autocomplete="off"
								onkeyup={e => (e.keyCode === 13 ? add(e) : null)}
							/>
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
		<div class="container dark">
			<img src={ message.user ? "https://www.w3schools.com//w3images/avatar_g2.jpg" : "https://www.w3schools.com//w3images/bandmember.jpg" } alt="Avatar" class={ message.user ? "right" : "" }/>
			<p>{message.text}</p>
		</div> 
	)
}
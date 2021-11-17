import { h } from 'hyperapp';
import Api from '../../../../api/Api';
import { delay } from "nanodelay";

// const mockMessages = [
// 	{
// 		user: "Kathie M.",
// 		text: `Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book.`,
// 		img: "https://www.w3schools.com//w3images/avatar_g2.jpg",
// 		time: "11:30",
// 	},
// 	{
// 		user: "Angel S.",
// 		text: `Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book.`,
// 		img: "https://www.w3schools.com//w3images/bandmember.jpg",
// 		time: "11:26",
// 	},
// ];

export default (initial) => ({
	state: {
		// message: '',
		messages: [],
	},

	actions: {
		// todo differentiate app messages
		addMessage: (message) => (state) => ({
			messages: [...state.messages, message],
		}),
		// modify: (value) => value
	},

	view:
		(state, { addMessage }) =>
		({ isVisible }) => {
			var { messages } = state;
			function init() {
				const onLeave = ({ clientID, username }) => {
					addMessage({
						text: `${username} has left the room`,
						appMsg: true,
					});
				};
				Api.setMessageHandlers({
					// join: onJoin,
					leave: onLeave,
					chat: addMessage,
				});
			}

			var keys = {};
			var handleKeyPress = (evt) => {
				let { keyCode, type } = evt || Event; // to deal with IE
				if (keyCode != 13 && keyCode != 16) return;
				let isKeyDown = type == "keydown";
				keys[keyCode] = isKeyDown;
				// if key down event & enter key is pressed down & shift isn't currently being pressed down
				if (isKeyDown && keys[13] && !keys[16]) {
					let text = evt.target.value;
					addMessage({
						username: Api.getUsername(),
						time: Date.now(),
						text,
					});
					delay(1).then((_) => (evt.target.value = ""))
					Api.sendChat(text);
				}
				return null;
			};

			const isLastMessage = (idx) => messages.length - 1 === idx;

			return (
				// ! root el needs key to fix grammarly breaking textarea
				<div oncreate={init} class="chat" key="_chat">
					<div class="chat-window">
						<ul>
							{messages.map((message, idx) => (
								<Message message={message} isLastMessage={isLastMessage(idx)}/>
							))}
						</ul>
					</div>
					<div class="chat-footer">
						<div class="input-wrapper">
							<textarea
								class={`chat-input ${
									!isVisible && "not-visible"
								}`}
								rows="2"
								autocomplete="off"
								placeholder="Type then press enter"
								onkeyup={handleKeyPress}
								onkeydown={handleKeyPress}
								tabindex="-1"
								// oninput={e => modify({ message: e.target.value })}
								// value={state.message}
							/>
							{/* <input class="chat-input" id="chat" placeholder="Type here and press enter" autocomplete="off"
								onkeyup={e => (e.keyCode === 13 ? add(e) : null)}
							/> */}
						</div>
					</div>
				</div>
			);
		},
});

// function scrollBottom(){
// 	let chatWindow = $('.chat-window')
// 	chatWindow.animate({ scrollTop: chatWindow.prop('scrollHeight') }, 1000);
// }

function Message({ message, isLastMessage }) {
	const imgSeed = message.username || "dicebear";
	return (
		<li class="message" oncreate={(e) => isLastMessage && e.scrollIntoView()}>
			{!message.appMsg && (
				<img
					src={`https://avatars.dicebear.com/api/avataaars/${imgSeed}.svg`}
				/>
			)}

			<div class="text">
				{!message.appMsg && (
					<div class="user-name">
						{message.username}
						{/* <span class="text-sm text-gray-300 pl-2">{message.time}</span> */}
					</div>
				)}
				<span class="message-text">{message.text}</span>
			</div>
		</li>
		// <div class="container dark">
		// 	<img src={ message.user ? "https://www.w3schools.com//w3images/avatar_g2.jpg" : "https://www.w3schools.com//w3images/bandmember.jpg" } alt="Avatar" class={ message.user ? "right" : "" }/>
		// 	<p>{message.text}</p>
		// </div>
	);
}

import { h } from 'hyperapp';
import Scene from '../../core/Scene';
import Api from '../../api/Api';

// const chatState = {
//     chatting: false,
//     //typing: true,
//     character: {},
//     empty: true,
//     messages: [],
//     error: null
// };
  
  
// const chatActions = {
//     showChat: (char) => () => ({ chatting: true, character: char.name }),
//     hideChat: () => () => ({ chatting: false, empty: true}),  
//     sendMessage: message => state => ({messages: [...state.messages, message], empty: false}),
//     empty: () => () => ({messages: [], empty: true}),
//     error: error => () => ({ empty: false, error })
// };

const Chat = ({state, actions}) => {

	//converse(state.character); //intialize watson conversation? (npc talks first)
	init()
	
	function init() {
		Api.getSessionId(function() {
			//Api.sendRequest('init req', null);
		});
	}

	var { messages } = state;

	var add = (evt) => {
		let message = evt.target.value
		if (typeof(message) !== undefined && $.trim(message) !== ''){
			message = { text: message, user: true}
			actions.sendMessage(message) 
			converse(message, actions, evt)
			scrollBottom();
		}
	};
	
	return (
		<div class="chat">
			<div class="chat-window">
			{
			messages.map((message, i) => 
				<div class={ message.user ? "container" : "container dark" }>
					<img src={ message.user ? "https://www.w3schools.com//w3images/avatar_g2.jpg" : "https://www.w3schools.com//w3images/bandmember.jpg" } alt="Avatar" class={ message.user ? "right" : "" }/>
					<p>{message.text}</p>
				</div> 
			)
			}
			</div>
			<div class="chat-footer clearfix">
				<div class="input-wrapper">
					<input class="chat-input" id="chat" placeholder="Type here..." autocomplete="off"
							onkeyup={e => (e.keyCode === 13 ? add(e) : null)}
						/>
				</div>
			</div>
		</div>	
	);
};

function converse(message, actions, evt){
	console.log('sending messsage1')
	/*var conversation_id, client_id, inputTex, latestResponse, params;
	var count = 0;
	var context = {};
	var paramsGlobal = {};
	var paramsConversation = {input: null, context: null};
	if (paramsConversation) {
		console.log('context params', paramsConversation);
		params.context = paramsConversation.context;
	}
	
	var params = {
		text: message,
		user: 'angel'
	}*/

	console.log('sending messsage')
	Api.sendRequest(message, {})
	//Api.sendRequest(message, context)

	setTimeout(() => {
		var response = Api.getResponsePayload() 
		
		actions.sendMessage({ text: response.watsonResponse.output.generic[0].text, user: false});// update UI with response from watson
	}, 1000);

	$(evt.target).val(''); // clear the text input



	/*$.post('/converse', params)
    .done(function onSucess(response){
		console.log('gotta response', response);
		
		//TODO: store and get user: userId from localstorage
		let message = { text: response.text, user: false}
		//let responseText = response.output.text[i]);

		Api.sendRequest('', null)

		if (response.apiCall){
			Scene.triggerEvent(response.apiCall.context);
		}

		actions.sendMessage(message);// update UI with response from watson

		// should move all meta logic into different script file
		// if(response.conversationResponse.intents[0].confidence > 0.6 || response.conversationResponse.context.system.dialog_turn_counter > 2){

		// 	if(response.conversationResponse.output.text.length > 1){
		// 	for(var i=0; i < response.conversationResponse.output.text.length; i++){
		// 		actions.sendMessage(response.conversationResponse.output.text[i]);
		// 	}

		// 	}else{
		// 	actions.sendMessage(message);
		// 	}
		// }else{
		// 	message.text = "Sorry. I dont know how to respond."
		// 	actions. sendMessage(message);
		// }
		
    })*/
}

function scrollBottom(){
	let chatWindow = $('.chat-window')
	chatWindow.animate({ scrollTop: chatWindow.prop('scrollHeight') }, 1000);
}



export default Chat;


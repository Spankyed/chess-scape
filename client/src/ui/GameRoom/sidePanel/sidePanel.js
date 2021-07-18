import { h } from 'hyperapp';
import Api from '../../../api/Api';
import Chat from './chat/chat'; 
import Moves from './moves/moves'; 

const chat = Chat()
const moves = Moves()

export default initial => ({
	state: { 
		chat: chat.state,
		moves: moves.state,
		currTab: "chat",
	},

	actions: { 
		chat: chat.actions,
		moves: chat.actions,
		changeTab: tab => state => ({ currTab: tab })
	},

	view: (state, actions) => ({isChatting}) => {
		const {currTab} = state
		const ChatView = chat.view(state.chat, actions.chat)
		const MovesView = moves.view(state.moves, actions.moves)

		return (
			<div class={`side-panel ${ !isChatting && 'panel-hidden' } h-full`}>
				<Tabs currTab={currTab} changeTab={actions.changeTab} />
			{	currTab === 'chat' &&
				<ChatView/>
			}
			{	currTab === 'moves' &&
				<MovesView/>
			} 
			{/* {	currTab === 'media' &&
				<MediaView/>
			}  */}
			</div>	
		);
	}
})

function Tabs({currTab, changeTab}){
	return (
		<ul class="flex justify-start" style="background-color:#302E2B">
			<li class='mr-1' onclick={ _=> changeTab('chat') }>
				<span class={`${ currTab === 'chat' ? 'active' : ''} mt-1 bg-white inline-block py-2 px-4 font-semibold text-blue-600 hover:text-blue-800 uppercase`}>
				Chat <span class="p-1 ml-1 text-sm text-gray-100 bg-blue-800 rounded-lg">4</span>
				</span>
			</li>
			<li class='mr-1' onclick={ _=> changeTab('moves') }>
				<span class={`${ currTab === 'moves' ? 'active' : ''} mt-1 bg-white inline-block py-2 px-4 font-semibold text-blue-600 hover:text-blue-800 uppercase`}>
				Moves
				</span>
			</li>
			<li class='mr-1' onclick={ _=> changeTab('media') }>
				<span class={`${ currTab === 'media' ? 'active' : ''} mt-1 bg-white inline-block py-2 px-4 font-semibold text-blue-600 hover:text-blue-800 uppercase`}>
				Media
				</span>
			</li>
		</ul>
	)
}
import { h } from 'hyperapp';
import Api from '../../../api/Api';
import Chat from './chat/chat'; 
import Moves from './moves/moves'; 
import Media from './media/media'; 

const chat = Chat()
const moves = Moves()
const media = Media()

export default initial => ({
	state: { 
		isVisible: true,
		chat: chat.state,
		moves: moves.state,
		media: media.state,
		// currTab: "chat",
		currTab: "media",
	},

	actions: {
		chat: chat.actions,
		moves: chat.actions,
		media: media.actions,
		hideSidePanel: () =>({isVisible: false}), 
		changeTab: tab => state => ({ currTab: tab })
	},

	view: (state, actions) => () => {
		const {currTab} = state
		const ChatView = chat.view(state.chat, actions.chat)
		const MovesView = moves.view(state.moves, actions.moves)
		const MediaView = media.view(state.media, actions.media)

		return (
			<div class={`side-panel ${ !state.isVisible && 'panel-hidden' } flex`}>
				<div onclick={actions.hideSidePanel} class="modal-overlay absolute top-0 block lg:hidden w-full h-full bg-gray-900 opacity-50"></div>
				<div class="panel-wrapper pointer-events-none">
					<Tabs currTab={currTab} changeTab={actions.changeTab} />
						<div class='content-wrapper h-full w-full pointer-events-auto'>
						{	currTab === 'chat' &&
							<ChatView/>
						}
						{	currTab === 'moves' &&
							<MovesView/>
						} 
						{	currTab === 'media' &&
							<MediaView/>
						} 
					</div>
				</div>
			</div>	
		);
	}
})

function Tabs({currTab, changeTab}){
	const tabs = ['chat','moves','media']
	const capitalize = s => s && s[0].toUpperCase() + s.slice(1)
	return (
		<ul class="flex justify-start pointer-events-none">
		{	tabs.map( (tab) => (
			<li class='mr-1 cursor-pointer pointer-events-auto' onclick={ _=> changeTab(tab) }>
				<span style="background-color:#989695" class={`${ currTab === tab ? 'active' : ''} mt-1 bg-white inline-block py-2 px-4 font-semibold text-blue-600 hover:text-blue-800 uppercase`}>
				{capitalize(tab)} 
				{/* <span class="p-1 ml-1 text-sm text-gray-100 bg-blue-800 rounded-lg">4</span> */}
				</span>
			</li>
			))
		}
		</ul>
	)
}
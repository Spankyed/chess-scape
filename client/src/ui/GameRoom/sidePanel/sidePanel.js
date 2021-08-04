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
		chat: chat.state,
		moves: moves.state,
		media: media.state,
		isVisible: true,
		currTab: "media"
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
			<div class={`side-panel ${ !state.isVisible && 'panel-hidden' }`}>
				<div onclick={actions.hideSidePanel} class="bg-overlay"></div>
				<div class="panel-wrapper">
					{/* Tabs */}
					<Tabs currTab={currTab} changeTab={actions.changeTab} />

					<div class='content-wrapper'>
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
		<ul class="tabs">
		{	tabs.map( (tab) => (
			<li onclick={ _=> changeTab(tab) } class={`tab ${ currTab === tab ? 'active' : ''}`}>
				{capitalize(tab)} 
				{/* <span class="p-1 ml-1 text-sm text-gray-100 bg-blue-800 rounded-lg">4</span> */}
			</li>
			))
		}
		</ul>
	)
}
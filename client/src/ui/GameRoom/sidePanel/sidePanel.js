import { h } from 'hyperapp';
import Api from '../../../api/Api';
import Chat from './chat/chat'; 
import Moves from './moves/moves'; 
import Media from './media/media'; 

const chat = Chat()
const moves = Moves()
const media = Media()

export default (initial) => ({
	state: {
		chat: chat.state,
		moves: moves.state,
		media: media.state,
		isVisible: false,
		currTab: "chat",
	},

	actions: {
		chat: chat.actions,
		moves: moves.actions,
		media: media.actions,
		changeTab: (tab) => (state) => ({ currTab: tab }),
		hideSidePanel: () => ({ isVisible: false }),
		toggleSidePanel:
			({ tab, isOpen } = {}) =>
			(state) => ({
				isVisible: isOpen || !state.isVisible,
				...(tab ? { currTab: tab } : {}),
			}),
	},

	view:
		(state, actions) =>
		({ roomID, alert, loaderRemoved }) => {
			const { currTab } = state;
			const { toggleSidePanel } = actions;
			const ChatView = chat.view(state.chat, actions.chat);
			const MovesView = moves.view(state.moves, actions.moves);
			const MediaView = media.view(state.media, actions.media);
			const isCurrTab = (tab) => currTab === tab;
			return !loaderRemoved ? (
				""
			) : (
				<div
					class={`side-panel
					${!state.isVisible && " panel-hidden"}
				`}
				>
					<div
						onclick={actions.hideSidePanel}
						class="bg-overlay"
					></div>
					<div class="panel-wrapper">
						{/* Tabs */}
						<Tabs currTab={currTab} changeTab={actions.changeTab} />

						<div class="content-wrapper">
							<div
								class={`panel-section ${
									isCurrTab("chat") && "visible"
								}`}
							>
								<ChatView isVisible={state.isVisible} />
							</div>
							<div
								class={`panel-section ${
									isCurrTab("moves") && "visible"
								}`}
							>
								<MovesView alert={alert} />
							</div>
							<div
								class={`panel-section ${
									isCurrTab("media") && "visible"
								}`}
							>
								<MediaView alert={alert} />
							</div>

							<button
								onclick={(_) => toggleSidePanel()}
								class={`panel-toggle ${
									state.isVisible && "close"
								}`}
							>
								<img src="./assets/controls/panel-open.svg"></img>
							</button>
						</div>
					</div>
				</div>
			);
		},
});

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
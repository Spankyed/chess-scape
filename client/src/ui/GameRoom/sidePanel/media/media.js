import { h } from 'hyperapp';
// import Api from '../../../../api/Api';
import Music from './music/music'; 
import Video from './video/video'; 

const music = Music()
const video = Video()

export default initial => ({
	state: { 
		music: music.state,
		video: video.state,
		currMoveIdx: 0,
		mediaOpen: 'video'
	},
	actions: { 
		music: music.actions,
		video: video.actions,
		showMedia: (type, force) => (state) => ({mediaOpen: force ? type : (state.mediaOpen == type ? '' : type)}),
	},
	view: (state, {showMedia,...actions}) => ({}) => {
		const MusicView = music.view(state.music, actions.music)
		const VideoView = video.view(state.video, actions.video)

		function isOpen(type){ return state.mediaOpen == type }
		return (
			<div class="media">
				<section class="music-section">
					<div onclick={_=> showMedia('music')} class={`${isOpen('music') && 'active'} media-dropdown ribbon`} >
						<h2>Play a song</h2>
						<img class={`arrow-up ${isOpen('music') && 'rotate-down'} `} src="./assets/sidePanel/icon-arrow-down.svg" alt="Play music dropdown"/>

					</div>
					<div class='section-content'>
					{	isOpen('music') &&
						<MusicView/>
					}
					</div>
				</section>
				<section class="video-section">
					<div onclick={_=> showMedia('video')} class={`${isOpen('video') && 'font-bold'} media-dropdown`} >
						<h2>Play a video</h2>
						<img class={`arrow-up ${isOpen('video') && 'rotate-down'} `} src="./assets/sidePanel/icon-arrow-down.svg" alt="Play video dropdown"/>
					</div>
					<div class='section-content'>
					{	isOpen('video') &&
						<VideoView/>
					}
					</div>
				</section>
			</div>
		);
	}
})


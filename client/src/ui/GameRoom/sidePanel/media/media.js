import { h } from 'hyperapp';
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
						<img class={`dropdown-arrow ${isOpen('music') && 'rotate-down'} `} src="./assets/sidePanel/icon-arrow-down.svg" alt="Play music dropdown"/>

					</div>
					{	isOpen('music') &&
						<div class='section-content'>
							<MusicView/>
						</div>
					}
				</section>
				<section class={`video-section ${!isOpen('video') && 'inactive'} `}>
					<div onclick={_=> showMedia('video')} class={`${isOpen('video') && 'active'} media-dropdown`} >
						<h2>Play a video</h2>
						<img class={`dropdown-arrow ${isOpen('video') && 'rotate-down'} `} src="./assets/sidePanel/icon-arrow-down.svg" alt="Play video dropdown"/>
					</div>
					{	isOpen('video') &&
						<div class='section-content'>
							<VideoView/>
						</div>
					}
				</section>
			</div>
		);
	}
})


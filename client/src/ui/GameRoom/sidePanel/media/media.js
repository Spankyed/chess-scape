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
	view: (state, actions) => ({}) => {
		const MusicView = music.view(state.music, actions.music)
		const VideoView = video.view(state.video, actions.video)

		const isOpen = (type) => state.mediaOpen == type
		return (
			<div class="media h-auto md:h-96">
				<div class="p-5 border-b border-divider">
					{/* <div @click="isOpen = !isOpen" class="flex items-center justify-between cursor-pointer text-neutral-darker hover:text-primary-hover" :class="{'font-bold' : isOpen}"> */}
					<div onclick={_=> actions.showMedia('music')} class={`${isOpen('music') && 'font-bold'}  flex items-center justify-between cursor-pointer text-neutral-darker hover:text-primary-hover`} >
						<span class="text-xs md:text-base">Play a song</span>
						<div>
						{/* <img class="mb-1 duration-300" :class="{'transform rotate-180' : isOpen}" src="images/icon-arrow-down.svg" alt="missing"> */}
						<img class={`${isOpen('music') && 'transform rotate-180'} h-3 mb-1 duration-300 float-right`} src="./assets/sidePanel/icon-arrow-down.svg" alt="missing"/>
						</div>
					</div>
					{/* <div x-show.transition.duration.300ms.origin.bottom="isOpen" @click.away="isOpen = false" class="pt-3 text-sm text-neutral" style="display: none;"> */}
					{	isOpen('music') &&
						<MusicView/>
					}
				</div>
				{/* <!-- end of item --> */}
				<div class="p-5 border-b border-divider">
					{/* <div @click="isOpen = !isOpen" class="flex items-center justify-between cursor-pointer text-neutral-darker hover:text-primary-hover" :class="{'font-bold' : isOpen}"> */}
					<div onclick={_=> actions.showMedia('video')} class={`${isOpen('video') && 'font-bold'} flex items-center justify-between cursor-pointer text-neutral-darker hover:text-primary-hover`} >
						<span class="text-xs md:text-base">Play a video</span>
						<div>
						{/* <img class="mb-1 duration-300" :class="{'transform rotate-180' : isOpen}" src="images/icon-arrow-down.svg" alt="missing"> */}
						<img class={`${isOpen('video') && 'transform rotate-180'} h-3 mb-1 duration-300 float-right`} src="./assets/sidePanel/icon-arrow-down.svg" alt="missing"/>
						</div>
					</div>
					{/* <div x-show.transition.duration.300ms.origin.bottom="isOpen" @click.away="isOpen = false" class="pt-3 text-sm text-neutral" style="display: none;"> */}
					{	isOpen('video') &&
						<VideoView/>
					}
				</div>
			</div>
		);
	}
})


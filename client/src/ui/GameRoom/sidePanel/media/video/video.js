import { h } from 'hyperapp';
// import Api from '../../../../api/Api';
// import LazyYoutubeEmbed from './ytLazyLoad';
const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
var quality = 'sd';
if (connection) {
	switch(connection.effectiveType) {
		case '4g': quality = 'maxres'; break;
		case '3g': quality = 'sd'; break;
		case '2g': quality = 'sd'; break;
		default: quality = 'hq';
	}
}

export default initial => ({
	state: { 
		isValidUrl: true,
		notFound: false,
		videoList: [],
		currVideoIdx: 0,
		videoReady: false,
		autoPlay: true,
		videoId: '',
		// thumbnail: '',
	},
	actions: { 
    	setVideoId: (videoId) => state => ({videoId}),
    	setValidity: (bool) => state => ({isValidUrl: bool}),
		submit: (videoId) => (state) => 
		({videoReady: true, videoList: [...state.videoList, videoId], 
		  videoId: state.autoPlay ? videoId : state.videoId}) // if autoplay, change videoID on submit
			
	},
	view: (state, actions) => ({}) => {
		// thumbnail: https://img.youtube.com/vi/<video-id>/0.jpg

		// function initVideo(){
		// 	lazyYoutubeEmbed = new LazyYoutubeEmbed()
		// }



		return (
			<div class="pt-3 text-sm text-neutral">
				{/* <a oncreate={initVideo} href="https://youtu.be/3vBwRfQbXkg" class="lazy-youtube-embed">HOW TO FUNK IN TWO MINUTES</a> */}
				
				<div class="lazy-youtube-embed">
				{ state.videoId && state.videoReady ?
					<iframe src={`https://www.youtube.com/embed/${state.videoId}?autoplay=1&fs=1&rel=0&modestbranding=1`} frameborder='0' allow='accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture'/>

					:
					<div class="thumb-wrapper absolute top-0 left-0 h-full w-full">
					{ (state.videoId) && 
						<Thumbnail ytId={state.videoId}/>
					}
						<div class={`ytlight__play ${ !state.videoId && 'pointer-events-none'}`}>
							<svg height="100%" version="1.1" viewBox="0 0 68 48" width="100%"><path d="M66.52,7.74c-0.78-2.93-2.49-5.41-5.42-6.19C55.79,.13,34,0,34,0S12.21,.13,6.9,1.55 C3.97,2.33,2.27,4.81,1.48,7.74C0.06,13.05,0,24,0,24s0.06,10.95,1.48,16.26c0.78,2.93,2.49,5.41,5.42,6.19 C12.21,47.87,34,48,34,48s21.79-0.13,27.1-1.55c2.93-0.78,4.64-3.26,5.42-6.19C67.94,34.95,68,24,68,24S67.94,13.05,66.52,7.74z" fill="#FF0000"></path><path d="M 45,24 27,14 27,34" fill="#fff"></path></svg>
						</div>			
					</div>
				}
				</div>



				{/* <iframe>

				</iframe> */}

				<VideoInput setValidity={actions.setValidity} isValidUrl={state.isValidUrl} setVideoId={actions.setVideoId} submit={actions.submit}/>

				{/* <div oncreate={initVideo} class='video'></div> */}
				{/* <div class="plyr__video-embed" id="player">
					<iframe
						src={`https://player.vimeo.com/video/76979871?loop=false&amp;byline=false&amp;portrait=false&amp;title=false&amp;speed=true&amp;transparent=0&amp;gesture=media`}
						allowfullscreen
						allowtransparency
						allow="autoplay"
					></iframe>
				</div> */}
		  </div>
		)
	}
})

function Thumbnail({ytId}){

	let handleBadImage = (e) => {
		// e.target
		console.log('bad image')
	}

	return (
		<img onerror={handleBadImage} src={`https://img.youtube.com/vi/${ytId}/${quality}default.jpg`}/>
	)
}

function VideoInput ({isValidUrl, setValidity, setVideoId, submit}){
	const attemptSubmit = (e) => {
		e.preventDefault();
		let url = e.target[0].value
		const videoId = parseYoutubeUrl(url)
		if (!videoId) return false
		console.log('submitting', url)
		submit(videoId, true)
		e.target.reset()
		return true
	}
	const setThumbPreviewIfValid = (e) => {
		const videoId = parseYoutubeUrl(e.target.value)
		setValidity(!!videoId)
		setVideoId(videoId || '')
	}
	return(
		<form action="" id="translate-form" class="w-full mx-auto  pt-2" onsubmit={attemptSubmit}>
			<div class="flex py-2 justify-center">
				<input type='submit' oninput={setThumbPreviewIfValid} name="url" class="h-10 bg-white flex-grow text-sm shadow-md appearance-none bg-transparent border-2 w-full text-gray-700 py-2 px-2 leading-tight focus:outline-none" type="text" placeholder="Paste YouTube video URL" aria-label="Video URL"></input>
				<button type='submit' class="h-10 flex shadow-md bg-green-600 p-3 text-white">
					<span class="float-left">Watch</span>
					{/* <img class="h-5 float-right" src="./assets/sidePanel/controls/play_button.svg"/> */}
				</button>

				{/* <Button langs={state.languages} lang_list={state.lang_list} filter={actions.filter} drop={state.dropdown} toggle={actions.toggle} validate={actions.validate}></Button> */}
			</div>   
			{	!isValidUrl && 
				<p class='ml-1 mt-0 mb-2 text-xs text-red-500'>Invalid video URL</p>
			}

		</form>
	)
}	

function VideoList ({isValidUrl, setValidity, submit}){
	const selectVideo = (e) => {
	}
	return(
		<form action="" id="translate-form" class="w-full mx-auto  pt-2">

		</form>
	)
}	

function VideoItem({video}){
	//  get video title/author/thumb
	return(
		<div class="music-row h-7">
			<img class="music-img h-full" src={`https://i.ytimg.com/vi/${video.id}/mqdefault.jpg`}/>
			<div class="music-info items-center text-center justify-between">
				<div class="w-1/5">Creator</div>
				<div class="w-3/5">Title</div>
				<div class="w-1/5">5:00</div>
			</div>
		</div>
	)
}

function parseUrl(url){
	let parse = { valid: false }
	if (url && url.length > 10){
		if(url.includes('youtube')){
		parse.valid = true
		parse.video_id = url.split("v=")[1];
		}
		else if(url.includes('youtu.be')){
		parse.valid = true
		parse.video_id = url.split("be/")[1];
		}
	}
	return parse
}

function getIdFromUrl(url){
	url = url.split(/(vi\/|v=|\/v\/|youtu\.be\/|\/embed\/)/);
	return (url[2] !== undefined) ? url[2].split(/[^0-9a-z_\-]/i)[0] : url[0];
}

const doesImageExist = (url) => new Promise((resolve) => {
	const img = new Image();
	img.src = url;
	img.onload = () => resolve(true);
	img.onerror = () => resolve(false);
});

function parseYoutubeUrl(url) {
	var p = /^(?:https?:\/\/)?(?:m\.|www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})(?:\S+)?$/;
	let urlMatch = url.match(p)
	if(urlMatch) return urlMatch[1];
	return false; // not a valid url
}


// .getVideoData()
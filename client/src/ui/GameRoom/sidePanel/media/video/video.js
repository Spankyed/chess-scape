import { h } from 'hyperapp';
// import Api from '../../../../api/Api';

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
		videoList: {}, // indexed list
		videoReady: false,
		autoPlay: true,
		currVideoId: 0
	},
	actions: { 
    	setCurrVideo: (videoId) => state => ({currVideoId: videoId}),
    	setValidity: (bool) => state => ({isValidUrl: bool}),
		submit: (videoId) => (state) => ({
			videoReady: true, videoList: {...state.videoList, [videoId]: { isLoading: true }}, 
			currVideoId: state.autoPlay ? videoId : state.currVideoId // if autoplay, change current video
		}), 
		setVideoData: (videoData) =>  (state) => ({
			videoList: {...state.videoList, [videoData.video_id]: videoData}
		})
	},
	view: (state, actions) => ({}) => {
		return (
			<div class="pt-3 text-sm text-neutral h-full overflow-hidden flex flex-col">
				<div class="lazy-youtube-embed">
				{ state.currVideoId && state.videoReady ?
					<Embed currVideoId={state.currVideoId} setVideoData={actions.setVideoData}/>
					:
					<div class="thumb-wrapper absolute top-0 left-0 h-full w-full">
					{ (!!state.currVideoId) && 
						<Thumbnail currVideoId={state.currVideoId}/>
					}
						<div class={`ytlight__play ${ !state.currVideoId && 'pointer-events-none'}`}>
							<svg height="100%" version="1.1" viewBox="0 0 68 48" width="100%"><path d="M66.52,7.74c-0.78-2.93-2.49-5.41-5.42-6.19C55.79,.13,34,0,34,0S12.21,.13,6.9,1.55 C3.97,2.33,2.27,4.81,1.48,7.74C0.06,13.05,0,24,0,24s0.06,10.95,1.48,16.26c0.78,2.93,2.49,5.41,5.42,6.19 C12.21,47.87,34,48,34,48s21.79-0.13,27.1-1.55c2.93-0.78,4.64-3.26,5.42-6.19C67.94,34.95,68,24,68,24S67.94,13.05,66.52,7.74z" fill="#FF0000"></path><path d="M 45,24 27,14 27,34" fill="#fff"></path></svg>
						</div>			
					</div>
				}
				</div>

				<VideoInput {...actions} {...state}/>

				{/* { Object.values(state.videoList).length > 0 && */}
				{ true &&
					<ul class="video-table overflow-auto flex flex-col">
						{
							Object.values(state.videoList).map((video, i)=>(
								<VideoItem video={video} currVideoId={state.currVideoId}/>
							))
						}
						<li class="flex video-row h-14 mb-1"><img class="video-img w-1/6" src="https://img.youtube.com/vi/1-rPwDTqwkM/mqdefault.jpg"/><div class="false flex-grow video-info hover:bg-gray-400  flex flex-col justify-center overflow-hidden"><h4 class="pr-2 uppercase text-gray-500 tracking-widest text-xs text-right">Loading...</h4><h1 class="mt-0 pl-3 pr-1 text-lg overflow-ellipsis whitespace-nowrap overflow-hidden">This Chess Hustler Called Me A Clown…</h1></div></li>
						<li class="flex video-row h-14 mb-1"><img class="video-img w-1/6" src="https://img.youtube.com/vi/1-rPwDTqwkM/mqdefault.jpg"/><div class="false flex-grow video-info hover:bg-gray-400  flex flex-col justify-center overflow-hidden"><h4 class="pr-2 uppercase text-gray-500 tracking-widest text-xs text-right">Loading...</h4><h1 class="mt-0 pl-3 pr-1 text-lg overflow-ellipsis whitespace-nowrap overflow-hidden">This Chess Hustler Called Me A Clown…</h1></div></li>
						<li class="flex video-row h-14 mb-1"><img class="video-img w-1/6" src="https://img.youtube.com/vi/1-rPwDTqwkM/mqdefault.jpg"/><div class="false flex-grow video-info hover:bg-gray-400  flex flex-col justify-center overflow-hidden"><h4 class="pr-2 uppercase text-gray-500 tracking-widest text-xs text-right">Loading...</h4><h1 class="mt-0 pl-3 pr-1 text-lg overflow-ellipsis whitespace-nowrap overflow-hidden">This Chess Hustler Called Me A Clown…</h1></div></li>
						<li class="flex video-row h-14 mb-1"><img class="video-img w-1/6" src="https://img.youtube.com/vi/1-rPwDTqwkM/mqdefault.jpg"/><div class="false flex-grow video-info hover:bg-gray-400  flex flex-col justify-center overflow-hidden"><h4 class="pr-2 uppercase text-gray-500 tracking-widest text-xs text-right">Loading...</h4><h1 class="mt-0 pl-3 pr-1 text-lg overflow-ellipsis whitespace-nowrap overflow-hidden">This Chess Hustler Called Me A Clown…</h1></div></li>
					</ul>
				}

		  </div>
		)
	}
})

function VideoItem({video, currVideoId}){
	console.log('vide',video)
	function isPlaying (){ return video.video_id == currVideoId }
	// {/* <img class="video-img h-full" src={`https://i.ytimg.com/vi/${video.id}/mqdefault.jpg`}/> */}
	return(
		<li class="flex video-row h-14 mb-1" style={`${ isPlaying()?'border-style: dashed;':''}`}>
			{	video.isLoading ?
				// <img class="video-img" src="https://placekitten.com/g/100/100"/> :
				<img class="video-img w-1/6" src="https://i.ytimg.com/vi/0/mqdefault.jpg"/> :
				<img class="video-img w-1/6" src={`https://img.youtube.com/vi/${video.video_id}/mqdefault.jpg`}/> 
			}
			<div class={`${ isPlaying() && 'bg-gray-300'} flex-grow video-info hover:bg-gray-400 flex flex-col justify-center overflow-hidden`}>
				{ (!video.isLoading && isPlaying()) &&
					<h4 class="pr-2 uppercase text-gray-500 tracking-widest text-xs text-right">Now Playing</h4>
				}
				{ video.isLoading &&
					<h4 class="pr-2 uppercase text-gray-500 tracking-widest text-xs text-right">Loading...</h4> 
				}
				<h1 class='mt-0 pl-3 pr-1 text-lg overflow-ellipsis whitespace-nowrap overflow-hidden'>{video.title}</h1>
				{/* <p class="text-gray-600 mb-2 text-sm">With J. Cole, Quavo, Ty Dollar $ign</p> */}
				{/* <p class="text-gray-600 text-sm">Created by <a>Spotify</a> - 50 songs, 3 hr 2 min</p> */}
			</div>
		</li>
	)
}

function VideoInput ({isValidUrl, setValidity, setCurrVideo, submit}){
	function attemptSubmit(e){
		e.preventDefault();
		let url = e.target[0].value
		const videoId = parseYoutubeUrl(url)
		if (!videoId) return false
		// console.log('submitting', url)
		submit(videoId, true)
		e.target.reset() // reset form
		return true
	}
	function setThumbPreviewIfValid(e){
		const videoId = parseYoutubeUrl(e.target.value)
		setValidity(!!videoId)
		setCurrVideo(videoId || 0)
	}
	return(
		<form onsubmit={attemptSubmit} class="w-full mx-auto pt-2" action="">
			<div class="flex py-2 justify-center">
				<input type='submit' oninput={setThumbPreviewIfValid} name="url" class="h-10 bg-white flex-grow text-sm shadow-md appearance-none bg-transparent border-2 w-full text-gray-700 py-2 px-2 leading-tight focus:outline-none" type="text" placeholder="Paste YouTube video URL" aria-label="Video URL"></input>
				<button type='submit' class="h-10 flex shadow-md bg-green-600 p-3 text-white">
					<span class="float-left">Watch</span>
					{/* <img class="h-5 float-right" src="./assets/sidePanel/controls/play_button.svg"/> */}
				</button>
				{/* <Button langs={state.languages} lang_list={state.lang_list} filter={actions.filter} drop={state.dropdown} toggle={actions.toggle} validate={actions.validate}></Button> */}
			</div>   
			{	!isValidUrl && 
				<p class='ml-1 mt-0 mb-2 text-xs text-red-800'>Invalid video URL</p>
				// Video could not be played, check url or try a different video
			}
		</form>
	)
}	

function Embed({currVideoId, setVideoData}){
	function setDataHandler(){
		window.onmessage = (e) => { // add Api listener to retrieve YT video info
			const {event, id, info} = JSON.parse(e.data)
			// console.log(JSON.parse(e.data))
			if (event == 'initialDelivery' && id == 1) setVideoData(info.videoData)
		}
	}
	function listen(e){
		let embed = e.target
		var message = JSON.stringify({ event: 'listening', id: 1, channel: 'widget' });
		embed.contentWindow.postMessage(message, 'https://www.youtube.com');
	}
	return (
		<iframe id='player' oncreate={setDataHandler} onload={listen} src={`https://www.youtube.com/embed/${currVideoId}?enablejsapi=1&widgetid=1&amp;gesture=media&autoplay=1`} frameborder='0' allow='accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture' allowfullscreen allowtransparency seamless/>
	)
}

function Thumbnail({currVideoId}){
	// thumbnail: https://img.youtube.com/vi/<video-id>/0.jpg
	let handleBadImage = (e) => console.log('bad image') 
	return (  <img onerror={handleBadImage} src={`https://img.youtube.com/vi/${currVideoId}/${quality}default.jpg`}/> )
}

function parseYoutubeUrl(url) {
	var p = /^(?:https?:\/\/)?(?:m\.|www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})(?:\S+)?$/;
	let urlMatch = url.match(p)
	if(urlMatch) return urlMatch[1];
	return false; // not a valid url
}




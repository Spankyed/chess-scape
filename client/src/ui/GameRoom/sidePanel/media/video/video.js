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
		isLoading: false,
		notFound: false,
		videoList: {}, // indexed list
		autoPlay: true,
		currVideoId: 0,
		thumbVideoId: 0,
	},
	actions: { 
		submit: videoId => state => ({
			isLoading: true,
			videoList: {[videoId]: { video_id: videoId, dataReady: false }, ...state.videoList}, 
			currVideoId: state.autoPlay ? videoId : state.currVideoId // if autoplay, change current video
		}), 
		setVideoData: videoData => state => ({
			videoList: {...state.videoList, [videoData.video_id]: videoData}
		}),
    	setValidity: bool => _=> ({isValidUrl: bool}),
		setCurrVideo: (videoId) => _=> ({currVideoId: videoId, thumbVideoId: videoId, isLoading: true}),
		setVideoThumb: (videoId) => _=> ({thumbVideoId: videoId}),
		clickThumbPlay: _=> state => ({currVideoId: state.thumbVideoId}),
		stopLoading: _=> _=> ({isLoading: false}),
	},
	view: (state, actions) => ({}) => {
		const isPlaying = _=> state.currVideoId && !state.isLoading
		return (
			<div class="video-area text-sm text-neutral h-full overflow-hidden flex flex-col">
				<div class="youtube-embed">
				{ !isPlaying() && 
					<Thumbnail {...actions} {...state}/>
				}
					<Embed isPlaying={isPlaying()} currVideoId={state.currVideoId} setVideoData={actions.setVideoData} stopLoading={actions.stopLoading}/>
				</div>
				<VideoInput {...actions} {...state}/>
				<ul class="video-table overflow-auto">
				{ Object.values(state.videoList).map((video, i)=>(
					<VideoItem video={video} currVideoId={state.currVideoId} setCurrVideo={actions.setCurrVideo}/>
				))}
				</ul>
		  </div>
		)
	}
})

function VideoItem({video, currVideoId, setCurrVideo}){
	const isPlaying = _=> video.video_id == currVideoId 
	const isLoading = _=> video.dataReady === false 
	const onClick = (e) => {
		if (currVideoId == video.video_id) return false
		e.target.scrollIntoView()
		setCurrVideo(video.video_id)
	}
	console.log('vide',video)
	return(
		<li onclick={onClick} class={`video-row ${ isPlaying() && 'selected'} h-14 mb-2`} title={video.title}>
			{/* {	video.dataReady ?
				// <img class="video-img" src="https://placekitten.com/g/100/100"/> :
				// <img class="video-img w-1/6" src="https://i.ytimg.com/vi/0/mqdefault.jpg"/> :
			} */}
			<img class="video-img w-1/6" src={`https://img.youtube.com/vi/${video.video_id}/mqdefault.jpg`}/> 
			<div class='flex-grow video-info flex flex-col justify-end overflow-hidden'>
				{ (!isLoading() && isPlaying()) &&
					<h4 class="pr-2 uppercase text-gray-500 tracking-widest text-xs text-right">Now Playing</h4>
				}
				{ isLoading() &&
					<h4 class="pr-1 uppercase text-gray-500 tracking-widest text-xs text-right">Loading...</h4> 
				}
				{ (!isLoading() && !isPlaying()) &&
					<h4 class="pl-3 uppercase text-gray-100 tracking-widest text-xs text-left overflow-ellipsis whitespace-nowrap overflow-hidden">{video.author}</h4>
				}
				<h1 class='mt-0 pl-3 pr-1 text-lg overflow-ellipsis whitespace-nowrap overflow-hidden'>{video.title}</h1>
				{/* <p class="text-gray-600 mb-2 text-sm">With J. Cole, Quavo, Ty Dollar $ign</p> */}
				{/* <p class="text-gray-600 text-sm">Created by <a>Spotify</a> - 50 songs, 3 hr 2 min</p> */}
			</div>
		</li>
	)
}

function VideoInput ({isValidUrl, currVideoId, setValidity, setVideoThumb, submit, isLoading}){
	const attemptSubmit = (e) =>{
		e.preventDefault();
		let url = e.target[0].value
		const videoId = parseYoutubeUrl(url)
		e.target.reset() // reset form
			if (!videoId || currVideoId == videoId) return false
		// console.log('submitting', url)
		submit(videoId, true)
		return true
	}
	const setThumbPreviewIfValid = (e) =>{
		// console.log('input', e.target)
		const videoId = parseYoutubeUrl(e.target.value)
		setValidity(!!videoId)
		setVideoThumb(videoId || 0) // will begin loading video in iframe
	}
	return(
		<form onsubmit={attemptSubmit} class="w-full mx-auto pt-2" action="">
			<div class="flex py-2 justify-center">
				<input disabled={isLoading} type='submit' oninput={setThumbPreviewIfValid} name="url" class="h-10 bg-white flex-grow text-sm shadow-md appearance-none bg-transparent border-2 w-full text-gray-700 py-2 px-2 leading-tight focus:outline-none" type="text" placeholder="Paste YouTube video URL" aria-label="Video URL"></input>
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

function Embed({currVideoId, setVideoData, isPlaying, stopLoading}){
	const addDataListener = _=>{
		window.onmessage = (e) => { // add Api listener to retrieve YT video info
			const {event, id, info} = JSON.parse(e.data)
			// console.log(JSON.parse(e.data))
			if (event == 'initialDelivery' && id == 1 && info.videoData.title) setVideoData(info.videoData)
		}
	}
	const handleLoad = (e) =>{
		if(!currVideoId) return
		let embed = e.target
		var message = JSON.stringify({ event: 'listening', id: 1, channel: 'widget' });
		embed.contentWindow.postMessage(message, 'https://www.youtube.com');
		stopLoading()
	}
	const videoSrc = _=>{
		return !currVideoId ? '' :
		`https://www.youtube.com/embed/${currVideoId}?enablejsapi=1&widgetid=1&amp;gesture=media&autoplay=1`
	}
	return (
		<iframe class={`${!isPlaying && 'hidden'}`} oncreate={addDataListener} onload={handleLoad} src={videoSrc()} frameborder='0' allow='accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture' allowfullscreen allowtransparency seamless/>
	)
}

function Thumbnail({thumbVideoId, currVideoId, isLoading, submit}){
	// thumbnail: https://img.youtube.com/vi/<video-id>/0.jpg
	const handleBadImage = (e) => console.log('bad image') 
	const onThumbPlayClick = e => {
		submit(thumbVideoId)
		document.getElementsByTagName('form')[0].reset()
	}
	return (  
		<div class="thumb-wrapper absolute top-0 left-0 h-full w-full">
		{ ((!!thumbVideoId && !currVideoId) || isLoading) &&
			<img onerror={handleBadImage} class="thumb-img" src={`https://img.youtube.com/vi/${thumbVideoId}/hqdefault.jpg`}/> 
			// <img onerror={handleBadImage} class="thumb-img" src={`https://img.youtube.com/vi/${thumbVideoId}/mqdefault.jpg`}/> 
			// <img onerror={handleBadImage} class="thumb-img" src={`https://img.youtube.com/vi/${thumbVideoId}/${quality}default.jpg`}/> 
		}
		{ !isLoading ?
			<div onclick={onThumbPlayClick} class={`middle-icon video-play-btn ${ !thumbVideoId && 'disabled'}`}>
				<svg height="100%" version="1.1" viewBox="0 0 68 48" width="100%"><path d="M66.52,7.74c-0.78-2.93-2.49-5.41-5.42-6.19C55.79,.13,34,0,34,0S12.21,.13,6.9,1.55 C3.97,2.33,2.27,4.81,1.48,7.74C0.06,13.05,0,24,0,24s0.06,10.95,1.48,16.26c0.78,2.93,2.49,5.41,5.42,6.19 C12.21,47.87,34,48,34,48s21.79-0.13,27.1-1.55c2.93-0.78,4.64-3.26,5.42-6.19C67.94,34.95,68,24,68,24S67.94,13.05,66.52,7.74z" fill="#FF0000"></path><path d="M 45,24 27,14 27,34" fill="#fff"></path></svg>
			</div> :
			<div class='middle-icon' style="top: calc(30%);">
				{/* <svg height="100%" version="1.1" id="loader-1" xmlns="http://www.w3.org/2000/svg"  x="0px" y="0px" width="40px" height="40px" viewBox="0 0 40 40" enable-background="new 0 0 40 40"><path opacity="0.2" fill="#000" d="M20.201,5.169c-8.254,0-14.946,6.692-14.946,14.946c0,8.255,6.692,14.946,14.946,14.946s14.946-6.691,14.946-14.946C35.146,11.861,28.455,5.169,20.201,5.169z M20.201,31.749c-6.425,0-11.634-5.208-11.634-11.634c0-6.425,5.209-11.634,11.634-11.634c6.425,0,11.633,5.209,11.633,11.634C31.834,26.541,26.626,31.749,20.201,31.749z"/><path fill="#000" d="M26.013,10.047l1.654-2.866c-2.198-1.272-4.743-2.012-7.466-2.012h0v3.312h0C22.32,8.481,24.301,9.057,26.013,10.047z"><animateTransform attributeType="xml" attributeName="transform" type="rotate" from="0 20 20" to="360 20 20" dur="0.5s" repeatCount="indefinite"/></path></svg>		 */}
				<svg class="loader" version="1.1" id="loader-1" xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="70px" height="70px" viewBox="0 0 50 50" style="enable-background:new 0 0 50 50;"><path fill="#000" d="M43.935,25.145c0-10.318-8.364-18.683-18.683-18.683c-10.318,0-18.683,8.365-18.683,18.683h4.068c0-8.071,6.543-14.615,14.615-14.615c8.072,0,14.615,6.543,14.615,14.615H43.935z"><animateTransform attributeType="xml" attributeName="transform" type="rotate" from="0 25 25" to="360 25 25" dur="0.6s" repeatCount="indefinite"/></path></svg>
			</div>
		}
		</div>
	)
}

function parseYoutubeUrl(url) {
	var p = /^(?:https?:\/\/)?(?:m\.|www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})(?:\S+)?$/;
	let urlMatch = url.match(p)
	if(urlMatch) return urlMatch[1];
	return false; // not a valid url
}




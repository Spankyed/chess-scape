import { h } from 'hyperapp';
// import Api from '../../../../api/Api';
import { nanoid } from 'nanoid/non-secure'

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
		share: true,
		autoPlay: true,
		currVideoId: 0,
		thumbVideoId: 0,
	},
	actions: { 
		toggle: option => state => ({
			[option]: !state[option], 
			isLoading: option == 'autoPlay' && !!state.currVideoId,
			thumbVideoId: state.currVideoId || state.thumbVideoId
		}),
		submit: videoId => state => {
			if (state.videoList[videoId]) return {}
			let autoPlay = state.autoPlay || !state.currVideoId 
			return {
				isLoading: autoPlay,
				videoList: { [videoId]: { video_id: videoId, dataReady: false }, ...state.videoList }, 
				currVideoId: autoPlay ? videoId : state.currVideoId // if autoplay, change current video
			}
		}
		, 
		setVideoData: videoData => state => ({
			videoList: {...state.videoList, [videoData.video_id]: {dataReady: true, ...videoData}}
		}),
    	setValidity: bool => _=> ({isValidUrl: bool}),
		setCurrVideo: (videoId) => _=> ({currVideoId: videoId, thumbVideoId: videoId, isLoading: true}),
		setVideoThumb: (videoId) => _=> ({thumbVideoId: videoId}),
		clickThumbPlay: _=> state => ({currVideoId: state.thumbVideoId}),
		stopLoading: _=> _=> ({isLoading: false}),
		play: video => state => ({ currVideoId:  video ? video.video_id : state.currVideoId})
	},
	view: (state, actions) => ({}) => {
		const isPlaying = _=> state.currVideoId && !state.isLoading
		return (
			<div class="video-area">
				<div class="youtube-embed">
				{ !isPlaying() && 
					<Thumbnail {...actions} {...state}/>
				}
					<Embed isPlaying={isPlaying()} {...actions} {...state}/>
				</div>
				<Options {...state} toggle={actions.toggle}/>
				<VideoInput {...actions} {...state}/>
				<ul class="video-table">
				{ Object.values(state.videoList).map((video, i)=>(
					<VideoItem video={video} currVideoId={state.currVideoId} setCurrVideo={actions.setCurrVideo}/>
				))}
				</ul>
		  </div>
		)
	}
})

function Options({share, autoPlay, toggle}){
	const options = [{text:'Share', id: 'share', value: share}, {text:'Auto-Play', id: 'autoPlay', value: autoPlay}]
	return (
		<div class="options w-full flex text-white justify-end">
		{	
		options.map( (option) => (
			<div class="option-item mr-3 flex items-center">
				<label for={option.id} class="flex items-center cursor-pointer" >
					<span class="label-text"> {option.text} </span>
					<div class="relative">
						<input id={option.id} type="checkbox" checked={option.value} onchange={_=> toggle(option.id)}/>
						<div class={`line ${ option.value && 'checked'}`}></div>
						<div class="dot"></div>
					</div>
				</label>
			</div>
		))
		}
		</div>
	)
}

function VideoItem({video, currVideoId, setCurrVideo}){
	const isPlaying = _=> video.video_id == currVideoId 
	const dataReady = _=> video.dataReady
	const onClick = (e) => {
		if (currVideoId == video.video_id) return false
		e.target.scrollIntoView()
		setCurrVideo(video.video_id)
	}
	return(
		<li onclick={onClick} class={`video-row ${ isPlaying() && 'selected'}`} title={video.title}>
			{/* 
				// <img class="video-img" src="https://placekitten.com/g/100/100"/> 
				// <img class="video-img w-1/6" src="https://i.ytimg.com/vi/0/mqdefault.jpg"/> 
			 */}
			<img class="video-img" src={`https://img.youtube.com/vi/${video.video_id}/mqdefault.jpg`}/> 
			<div class='video-info'>
				{ (dataReady() && isPlaying()) &&
					<h4 class="isPlaying">Now Playing</h4>
				}
				{ (!dataReady() && isPlaying()) &&
					<h4 class="isLoading">Loading...</h4> 
				}
				{ (!dataReady() && !isPlaying()) &&
					<h4 class="isLoading">Click to load</h4> 
				}
				{ (dataReady() && !isPlaying()) &&
					<h4 class="video-author">{video.author}</h4>
				}
				<h1 class='video-title'>{video.title}</h1>
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
		setVideoThumb(videoId || 0) // should begin loading video in iframe (doesn't)
	}
	return(
		<form onsubmit={attemptSubmit} class="video-form" action="">
			<div class="input-wrapper">
				<input disabled={isLoading} oninput={setThumbPreviewIfValid} class="input shadow-md" placeholder="Paste YouTube video URL" aria-label="Video URL" name="url" type='text' ></input>
				<button type='submit' class="submit-button"> Watch </button>
			</div>   
			{	!isValidUrl && 
				<p class='invalid-message'>Invalid video URL</p>
				// <p class='invalid-message'>Video could not be played, check url or try a different video</p>
			}
		</form>
	)
}	

function Embed({currVideoId, videoList, setVideoData, isPlaying, stopLoading, autoPlay, play}){
	const addDataListener = _=> { //  adds an iframe Api listener to retrieve YT video info
		window.onmessage = (e) => { // no cleanup needed, overrides existing message handler
			const {event, id, info} = JSON.parse(e.data)
			console.log(JSON.parse(e.data))
			if (id != 1) return
			if (event == 'initialDelivery' && info.videoData.title) setVideoData(info.videoData)
			if (autoPlay && event == 'infoDelivery' && info.playerState === 0) play(next(videoList, currVideoId))
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
		`https://www.youtube-nocookie.com/embed/${currVideoId}?autoplay=${autoPlay ? 1 : 0}&enablejsapi=1&widgetid=1&amp;gesture=media&showinfo=1&modestbranding=1`
	}
	// todo: generate key for iframe element to fix potential render issues
	return (
		<iframe oncreate={addDataListener} onload={handleLoad} onerror={stopLoading} src={videoSrc()} class={`${!isPlaying && 'hidden'}`} frameborder='0' allow='accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture' allowfullscreen allowtransparency seamless/>
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
		<div class="thumb-wrapper">
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
				<svg class="loader" version="1.1" xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="70px" height="70px" viewBox="0 0 50 50" style="enable-background:new 0 0 50 50;"><path fill="#000" d="M43.935,25.145c0-10.318-8.364-18.683-18.683-18.683c-10.318,0-18.683,8.365-18.683,18.683h4.068c0-8.071,6.543-14.615,14.615-14.615c8.072,0,14.615,6.543,14.615,14.615H43.935z"><animateTransform attributeType="xml" attributeName="transform" type="rotate" from="0 25 25" to="360 25 25" dur="0.6s" repeatCount="indefinite"/></path></svg>
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

// Return next object key
function next(obj, key) {
	var keys = Object.keys(obj), 
	i = keys.indexOf(key);
	console.log('next',i !== -1 && keys[i + 1] && obj[keys[i + 1]])
	return i !== -1 && keys[i + 1] && obj[keys[i + 1]];
};


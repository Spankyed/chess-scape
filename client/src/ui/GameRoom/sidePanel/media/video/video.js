import { h } from 'hyperapp';
// import Api from '../../../../api/Api';
// import Plyr from 'plyr';
 import LazyYoutubeEmbed from './ytLoad';

export default initial => ({
	state: { 
		isValidUrl: true,
		videPlaylist: [],
		currVideoIdx: 0,
	},
	actions: { 
    	setValidity: (bool) => state => ({isValidUrl: bool}),
		showMedia: (type, force) => (state) => ({mediaOpen: type}),
	},
	view: (state, actions) => ({}) => {
		// thumbnail: https://img.youtube.com/vi/<video-id>/0.jpg

		function initVideo(){
			new LazyYoutubeEmbed()
		}

		return (
			<div class="pt-3 text-sm text-neutral">
				<a oncreate={initVideo} href="https://youtu.be/3vBwRfQbXkg" class="lazy-youtube-embed ">HOW TO FUNK IN TWO MINUTES</a>

				<VideoForm setValidity={actions.setValidity} isValidUrl={state.isValidUrl}/>
				{/* <label for="price" class="block text-sm font-medium text-gray-700 text-xs md:text-base">Price</label>
				<div class="mt-1 relative rounded-md shadow-sm">
					<div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
						<span class="text-gray-500 sm:text-sm">
						$
						</span>
					</div>
					<input type="text" name="price" id="price" class="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md" placeholder="0.00"/>
					<div class="absolute inset-y-0 right-0 flex items-center">
						<label for="currency" class="sr-only">Currency</label>
						<select id="currency" name="currency" class="focus:ring-indigo-500 focus:border-indigo-500 h-full py-0 pl-2 pr-7 border-transparent bg-transparent text-gray-500 sm:text-sm rounded-md">
						<option>USD</option>
						<option>CAD</option>
						<option>EUR</option>
						</select>
					</div>
				</div> */}
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


function VideoForm ({isValidUrl, setValidity, submit}){
	const attemptSubmit = (e) => {
		e.preventDefault();
		let url = e.target[0].value
		const parsedUrl = parseUrl(url)
		if (!parsedUrl.valid) return false
		// submit(parsedUrl)
		console.log('submitting', url)
		e.target.reset()
		return true
	}
	return(
		<form action="" id="translate-form" class="w-full mx-auto  pt-2" onsubmit={attemptSubmit}>
			<div class="flex py-2 justify-center">
				<input type='submit' oninput={(e)=> setValidity(parseUrl(e.target.value).valid)} name="url" class="h-10 bg-white flex-grow text-sm shadow-md appearance-none bg-transparent border-2 w-full text-gray-700 py-2 px-2 leading-tight focus:outline-none" type="text" placeholder="Paste YouTube video URL" aria-label="Video URL"></input>
				<button type='submit' class="h-10 flex shadow-md bg-green-600 p-3 text-white">
					<span class="float-left">Play</span>
					<img class="h-5 float-right" src="./assets/sidePanel/controls/play_button.svg"/>
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
		<form action="" id="translate-form" class="w-full mx-auto  pt-2" onsubmit={attemptSubmit}>

		</form>
	)
}	

function Video({video}){
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


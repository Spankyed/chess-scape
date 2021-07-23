import { h } from 'hyperapp';
// import Api from '../../../../api/Api';

const capitalize = s => s && s[0].toUpperCase() + s.slice(1)

export default initial => ({
	state: { 
		currMoveIdx: 0,
		showMusic: true,
		showVideo: false,
	},
	actions: { 
		showTab: (type) => (state) => ({[`show${capitalize(type)}`]: true}),
		toggleTab: (type) => (state) => ({[`show${capitalize(type)}`]: !state[`show${capitalize(type)}`]}),
	},
	view: ({showMusic,showVideo}, actions) => ({}) => {
		return (
			<div class="media h-auto md:h-96">

				<div class="p-5 border-b border-divider">
					{/* <div @click="isOpen = !isOpen" class="flex items-center justify-between cursor-pointer text-neutral-darker hover:text-primary-hover" :class="{'font-bold' : isOpen}"> */}
					<div onclick={_=> actions.toggleTab('music')} class={`${showMusic && 'font-bold'}  flex items-center justify-between cursor-pointer text-neutral-darker hover:text-primary-hover`} >
						<span class="text-xs md:text-base">Play a song</span>
						<div>
						{/* <img class="mb-1 duration-300" :class="{'transform rotate-180' : isOpen}" src="images/icon-arrow-down.svg" alt="missing"> */}
						<img class={`${showMusic && 'transform rotate-180'} h-3 mb-1 duration-300 float-right`} src="./assets/sidePanel/icon-arrow-down.svg" alt="missing"/>
						</div>
					</div>
					{/* <div x-show.transition.duration.300ms.origin.bottom="isOpen" @click.away="isOpen = false" class="pt-3 text-sm text-neutral" style="display: none;"> */}
					{	showMusic &&
						<Music/>
					}
				</div>
				{/* <!-- end of item --> */}

				<div class="p-5 border-b border-divider">
					{/* <div @click="isOpen = !isOpen" class="flex items-center justify-between cursor-pointer text-neutral-darker hover:text-primary-hover" :class="{'font-bold' : isOpen}"> */}
					<div onclick={_=> actions.toggleTab('video')} class={`${showVideo && 'font-bold'} flex items-center justify-between cursor-pointer text-neutral-darker hover:text-primary-hover`} >
						<span class="text-xs md:text-base">Play a video</span>
						<div>
						{/* <img class="mb-1 duration-300" :class="{'transform rotate-180' : isOpen}" src="images/icon-arrow-down.svg" alt="missing"> */}
						<img class={`${showVideo && 'transform rotate-180'} h-3 mb-1 duration-300 float-right`} src="./assets/sidePanel/icon-arrow-down.svg" alt="missing"/>
						</div>
					</div>
					{/* <div x-show.transition.duration.300ms.origin.bottom="isOpen" @click.away="isOpen = false" class="pt-3 text-sm text-neutral" style="display: none;"> */}
					{	showVideo &&
						<Video/>
					}
				</div>
			</div>
		);
	}
})
function Music({move,idx}){
	return (
		<div class="pt-3 text-sm text-neutral">
			<div class="add-music border h-64 text-center" style="justify-content: center; align-items: center">
				<img style="height:75%" class="pt-8 mx-auto" src="./assets/sidePanel/controls/add_music.svg"/>	
				<span>Add or drag music file here</span>
			</div>
			<div class='flex items-center justify-between' id="audio-player-container">
				<audio src="" preload="metadata" loop/>
				<button id="mute" class="control-icon">
					<img class="h-6" src="./assets/sidePanel/controls/music_button.svg"/>
				</button>
				<button id="play" class="control-icon">
					<img class="h-6" src="./assets/sidePanel/controls/play_button.svg"/>
				</button>
				<input type="range" id="seek-slider" max="100" value="0"/>
				<span id="duration" class="time">0:00</span>
				{/* <output id="volume-output">100</output> */}
				{/* <input type="range" id="volume-slider" max="100" value="100"/> */}
			</div>
		
			<div>
				<img class="mt-5 h-7 plus-music" src="./assets/sidePanel/controls/plus_music.svg"
					style="width: 13%;"/>
				<div class="music-table">
					<MusicItem/>
					<MusicItem/>
					<MusicItem/>
					<MusicItem/>
					<MusicItem/>
				</div>
			</div>

		</div>
	)
}

function MusicItem(){
	return(
		<div class="music-row h-7">
			<img class="music-img h-full" src="https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png"/>
			<div class="music-info items-center text-center justify-between">
				<div class="w-1/5">Artist</div>
				<div class="w-3/5">Title</div>
				<div class="w-1/5">5:00</div>
			</div>
		</div>
	)
}

function Video({move,idx}){
	// thumbnail: https://img.youtube.com/vi/<video-id>/0.jpg
	return (
		<div class="pt-3 text-sm text-neutral">
			<span class="text-xs md:text-base">
			You can invite up to 2 additional users on the Free plan. There is no limit on
			team members for the Premium plan.
			</span>
		</div>
	)
}

function gRI(arr) {
	return arr[Math.floor(Math.random() * arr.length)];
}












const everything = function(element) {  
	const shadow = element.shadowRoot;
  
	  const audioPlayerContainer = shadow.getElementById('audio-player-container');
	  const playIconContainer = shadow.getElementById('play-icon');
	  const seekSlider = shadow.getElementById('seek-slider');
	  const volumeSlider = shadow.getElementById('volume-slider');
	  const muteIconContainer = shadow.getElementById('mute-icon');
	  const audio = shadow.querySelector('audio');
	  const durationContainer = shadow.getElementById('duration');
	  const currentTimeContainer = shadow.getElementById('current-time');
	  const outputContainer = shadow.getElementById('volume-output');
	  let playState = 'play';
	  let muteState = 'unmute';
	  let raf = null;
  
	  audio.src = element.getAttribute('data-src');
  
	  const playAnimation = lottieWeb.loadAnimation({
		  container: playIconContainer,
		  path: 'https://maxst.icons8.com/vue-static/landings/animated-icons/icons/pause/pause.json',
		  renderer: 'svg',
		  loop: false,
		  autoplay: false,
		  name: "Play Animation",
	  });
			
	  const muteAnimation = lottieWeb.loadAnimation({
		  container: muteIconContainer,
		  path: 'https://maxst.icons8.com/vue-static/landings/animated-icons/icons/mute/mute.json',
		  renderer: 'svg',
		  loop: false,
		  autoplay: false,
		  name: "Mute Animation",
	  });
			
	  playAnimation.goToAndStop(14, true);
  
	  const whilePlaying = () => {
		  seekSlider.value = Math.floor(audio.currentTime);
		  currentTimeContainer.textContent = calculateTime(seekSlider.value);
		  audioPlayerContainer.style.setProperty('--seek-before-width', `${seekSlider.value / seekSlider.max * 100}%`);
		  raf = requestAnimationFrame(whilePlaying);
	  }
  
	  const showRangeProgress = (rangeInput) => {
		  if(rangeInput === seekSlider) audioPlayerContainer.style.setProperty('--seek-before-width', rangeInput.value / rangeInput.max * 100 + '%');
		  else audioPlayerContainer.style.setProperty('--volume-before-width', rangeInput.value / rangeInput.max * 100 + '%');
	  }
  
	  const calculateTime = (secs) => {
		  const minutes = Math.floor(secs / 60);
		  const seconds = Math.floor(secs % 60);
		  const returnedSeconds = seconds < 10 ? `0${seconds}` : `${seconds}`;
		  return `${minutes}:${returnedSeconds}`;
	  }
		  
	  const displayDuration = () => {
		  durationContainer.textContent = calculateTime(audio.duration);
	  }
		  
	  const setSliderMax = () => {
		  seekSlider.max = Math.floor(audio.duration);
	  }
		  
	  const displayBufferedAmount = () => {
		  const bufferedAmount = Math.floor(audio.buffered.end(audio.buffered.length - 1));
		  audioPlayerContainer.style.setProperty('--buffered-width', `${(bufferedAmount / seekSlider.max) * 100}%`);
	  }
  
	  if (audio.readyState > 0) {
		  displayDuration();
		  setSliderMax();
		  displayBufferedAmount();
	  } else {
		  audio.addEventListener('loadedmetadata', () => {
			  displayDuration();
			  setSliderMax();
			  displayBufferedAmount();
		  });
	  }
  
	  playIconContainer.addEventListener('click', () => {
		  if(playState === 'play') {
			  audio.play();
			  playAnimation.playSegments([14, 27], true);
			  requestAnimationFrame(whilePlaying);
			  playState = 'pause';
		  } else {
			  audio.pause();
			  playAnimation.playSegments([0, 14], true);
			  cancelAnimationFrame(raf);
			  playState = 'play';
		  }
	  });
		  
	  muteIconContainer.addEventListener('click', () => {
		  if(muteState === 'unmute') {
			  muteAnimation.playSegments([0, 15], true);
			  audio.muted = true;
			  muteState = 'mute';
		  } else {
			  muteAnimation.playSegments([15, 25], true);
			  audio.muted = false;
			  muteState = 'unmute';
		  }
	  });
  
	  audio.addEventListener('progress', displayBufferedAmount);
  
	  seekSlider.addEventListener('input', (e) => {
		  showRangeProgress(e.target);
		  currentTimeContainer.textContent = calculateTime(seekSlider.value);
		  if(!audio.paused) {
			  cancelAnimationFrame(raf);
		  }
	  });
  
	  seekSlider.addEventListener('change', () => {
		  audio.currentTime = seekSlider.value;
		  if(!audio.paused) {
			  requestAnimationFrame(whilePlaying);
		  }
	  });
  
	  volumeSlider.addEventListener('input', (e) => {
		  const value = e.target.value;
		  showRangeProgress(e.target);
		  outputContainer.textContent = value;
		  audio.volume = value / 100;
	  });
  
	  if('mediaSession' in navigator) {
		  navigator.mediaSession.metadata = new MediaMetadata({
			  title: 'Komorebi',
			  artist: 'Anitek',
			  album: 'MainStay',
			  artwork: [
				  { src: 'https://assets.codepen.io/4358584/1.300.jpg', sizes: '96x96', type: 'image/png' },
				  { src: 'https://assets.codepen.io/4358584/1.300.jpg', sizes: '128x128', type: 'image/png' },
				  { src: 'https://assets.codepen.io/4358584/1.300.jpg', sizes: '192x192', type: 'image/png' },
				  { src: 'https://assets.codepen.io/4358584/1.300.jpg', sizes: '256x256', type: 'image/png' },
				  { src: 'https://assets.codepen.io/4358584/1.300.jpg', sizes: '384x384', type: 'image/png' },
				  { src: 'https://assets.codepen.io/4358584/1.300.jpg', sizes: '512x512', type: 'image/png' }
			  ]
		  });
		  navigator.mediaSession.setActionHandler('play', () => {
			  if(playState === 'play') {
				  audio.play();
				  playAnimation.playSegments([14, 27], true);
				  requestAnimationFrame(whilePlaying);
				  playState = 'pause';
			  } else {
				  audio.pause();
				  playAnimation.playSegments([0, 14], true);
				  cancelAnimationFrame(raf);
				  playState = 'play';
			  }
		  });
		  navigator.mediaSession.setActionHandler('pause', () => {
			  if(playState === 'play') {
				  audio.play();
				  playAnimation.playSegments([14, 27], true);
				  requestAnimationFrame(whilePlaying);
				  playState = 'pause';
			  } else {
				  audio.pause();
				  playAnimation.playSegments([0, 14], true);
				  cancelAnimationFrame(raf);
				  playState = 'play';
			  }
		  });
		  navigator.mediaSession.setActionHandler('seekbackward', (details) => {
			  audio.currentTime = audio.currentTime - (details.seekOffset || 10);
		  });
		  navigator.mediaSession.setActionHandler('seekforward', (details) => {
			  audio.currentTime = audio.currentTime + (details.seekOffset || 10);
		  });
		  navigator.mediaSession.setActionHandler('seekto', (details) => {
			  if (details.fastSeek && 'fastSeek' in audio) {
				audio.fastSeek(details.seekTime);
				return;
			  }
			  audio.currentTime = details.seekTime;
		  });
		  navigator.mediaSession.setActionHandler('stop', () => {
			  audio.currentTime = 0;
			  seekSlider.value = 0;
			  audioPlayerContainer.style.setProperty('--seek-before-width', '0%');
			  currentTimeContainer.textContent = '0:00';
			  if(playState === 'pause') {
				  playAnimation.playSegments([0, 14], true);
				  cancelAnimationFrame(raf);
				  playState = 'play';
			  }
		  });
	  }
  }
  
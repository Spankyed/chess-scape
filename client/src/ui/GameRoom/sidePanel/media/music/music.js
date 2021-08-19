import { h } from 'hyperapp';
import Api from '../../../../../api/Api';
import { nanoid } from 'nanoid/non-secure'
import { serialize, deserialize } from 'bson';

//todo: check mime type before sending any files
export default initial => ({
	state: {
		autoPlay: true,
		allowShare: true,
		persistShareSetting: false, // if false prompts user every time song is shared
		selectedFile: null,
		songList: {},
		currSongId: 0,
		isLoading: false,
		isPreviewing: false,
		songPreview: { 
			src: null,
			title: '',
			fileName: '',
			image: '',
			duration: '',
			dataReady: false
		}
	},
	actions: { 
		startLoading: _=> _=> ({isLoading: true}),
		stopLoading: _=> _=> ({isLoading: false}),
		setSelectedFile: file => _ => ({selectedFile: file}),
		addSong: song => state => {
			let songId = song.songId
			if (songId && state.songList[songId]) return {} // not reachable ids always diff; compare names instead
			// let {songList, currSongId, autoPlay, isPreviewing} = state
			let play = state.autoPlay || !state.currSongId 
			return {
				// isLoading: autoPlay,
				songPreview: {}, // clear preview
				songList: { [songId]: { songId, ...song },  ...state.songList }, 
				currSongId: play ? songId : state.currSongId, // if autoplay, play new song
				isPreviewing: false
			}
		}, 
		setSongData: ({songId, data, preview}) => ({songList, songPreview}) => (
			preview ? 
			{ songPreview: {...songPreview, ...data }, isLoading: false} : 
			{ songList: {...songList, [songId]: {...songList[songId], ...data}}}
		),
		setCurrSong: songId => _=> ({ currSongId: songId, isPreviewing: false}),
		setSongPreview: (song) => state => ({ songPreview: song, isPreviewing: true }),
		cancelPreview: _ => _=> ({isPreviewing: false, isLoading: false}),
		setShare: ({bool, persist}) => state => ({ allowShare: bool, persistShareSetting: persist}),
		toggle: option => state => ({ [option]: !state[option] }),
		getState: _=>({songList, currSongId})=>({songList, currSongId})
	},
	view: (state, actions) => ({alert}) => {
		let notEmpty = Object.getOwnPropertyNames(state.songList).length > 0
		let songList = Object.values(state.songList)
		Api.setMessageHandlers({
			music: message => {
				// message = deserialize(message)
				if (!state.allowShare) return
				if (!state.persistShareSetting) promptShare(message, alert, actions)
				else addFromBinary(message)
			}
		})
		function addFromBinary({song, rawData}){
			let blob = new Blob([rawData], {type : 'audio/ogg'});
			let blobUrl = URL.createObjectURL(blob);
			console.log('adding shared', {...song, src: blobUrl}) //addSong(songId)
			actions.addSong({...song, src: blobUrl})
		}
		function promptShare(message, alert, actions){
			let {setShare, addVideo} = actions
			// songId = '3vBwRfQbXkg'
			alert.show({
				icon: "./assets/sidePanel/controls/music_icon.svg",
				heading: 'Music Shared',
				message: 'A user wants to share a song with you.', 
				actions: {
					positive: { text: 'Allow', handler: (bool, persist) => {
						setShare({bool, persist})
						addFromBinary(message)
					}},
					negative: { text: 'Deny', handler: (bool, persist) => {
						if (persist) setShare({bool, persist})
					}}, 
				},
				dontAskAgain: false
			})
		}
		return (
			<div class="music-area text-neutral">
				<Options {...state} toggle={actions.toggle}/>
				<SongPlayer actions={actions} state={state}/>

				{ notEmpty &&
					<ul class="music-table">
					{ songList.map((song, i)=>(
						<MusicItem song={song} setCurrSong={actions.setCurrSong} currSongId={state.currSongId}/>
					))}
					</ul>
				}
			</div>
		)
	}
})

function SongPlayer({ state, actions }){
	let {currSongId, isLoading, isPreviewing, songPreview, allowShare, selectedFile} = state // should be consts
	let {setSongPreview, addSong, setSongData, startLoading, cancelPreview, setSelectedFile} = actions
	let isPlaying = !!currSongId
	const noop = _=>{}

	function preview(e){
		startLoading()
		let file = setSelectedFile(e.target.files[0]).selectedFile
		processSong(file, true)
		// input.files[0].type.match('audio.*') // ensure theres file of type auido
		// todo: set size limit err msg
		// todo: on error reset form
	}
	async function submit(){
		let form = document.getElementsByTagName('form')[0] // todo: ensure is song form
		let song = songPreview
		let file = selectedFile;
		if (isPreviewing) addSong(song)
		else {
			file = setSelectedFile(form.song.files[0]).selectedFile
			song = await processSong(file)
		}
		if (allowShare) {
			let rawData = await getRawSongData(file)
			Api.shareMusic(song, rawData)
		}
		form.reset()
		setTimeout(_=> form.song.value = [], 500)
	}
	return(
		<form name='song-form'>
			<div class='song-player-wrapper'>
				{ isLoading && <Loader/>}
				{ isPlaying ?
					<Song {...actions} {...state}/> :
					<div class="song-preview-wrapper h-full w-full">
						<input onchange={preview} class={`file-input ${isPreviewing && 'no-pointers'}`} id="song" name="song" type='file' accept="audio/*" disabled={isPreviewing}/>
						{/* <p class='invalid-message'>Song exceeds 10 mb file limit</p>  */}
						{ isPreviewing ? 
						<Preview song={songPreview} cancelPreview={cancelPreview}/> : 
						<Input/>
						}
					</div> 
				}
			</div>

			{ (isPreviewing || isPlaying) &&
			<div onclick={!isPlaying ? submit : noop} 
					class={`add-btn ${ ((!isLoading && isPreviewing) || (!isPlaying && isPreviewing)) && 'preview'}`}>
				{ isPlaying && 
				<input onchange={submit} class='file-input' id="song" name="song" type='file' accept="audio/*"/>
				}
				<img class="add-icon" src="./assets/sidePanel/controls/plus_music.svg"/>
				<span class='add-text'>
					{isPreviewing ? "Play" : 'Add Song'}
				</span>
			</div>
			}
		</form>
	)	
	function Song({currSongId, songList, autoPlay, setCurrSong, getState}){
		const song = songList[currSongId]
		let imageStyle = `background-image: url(${song.image})` // todo: add default img?
		function handleSongEnd(audio){
			// console.log('audio el',audio)
			audio.addEventListener('ended', () => { 
				if(autoPlay){
					let {songList, currSongId} = getState()
					let nextSong = next(songList, currSongId)
					if (nextSong) setCurrSong(nextSong.songId)
				}
			}, false);
		}
		return(
			<div class="song-container" style={imageStyle} title={song.title}>
				<div class='song-title'>{song.title}</div>
				<div class="audio-wrapper">
					<audio oncreate={handleSongEnd} src={song.src} controls autoplay>
						<source src={song.src}/>
					</audio>
				</div>
			</div>
		)
	}
	function Preview({song, cancelPreview}){
		const previewImage = `background-image: url(${song.image})` // todo: add default img
		const cancel = _=>{
			let form = document.getElementsByTagName('form')[0] // todo: ensure is song form
			form.song.value = []
			cancelPreview()
		}
		return(
			<div class="song-container" style={previewImage} title={song.fileName}>
				<div class='song-title'>{song.title}</div>
				<img onclick={cancel} class='trash-icon' src="../assets/sidePanel/controls/trash.svg"/>	
			</div>
		)
	}
	function Input(){
		return(
			<div class="song-input cursor-pointer">
				<img class='input-icon' src="../assets/sidePanel/controls/add_music.svg"/>	
				<div class='input-text'><span>Choose</span> or drag music file here</div>
				{/* <img src="http://placekitten.com/200/300"/> */}
			</div>
		)
	}

	async function processSong(file, preview){
		let song = parseMusicFile(file)
		if (preview) setSongPreview(song)
		else addSong(song)
		let data = await getSongInfo(file, song)
		setSongData({songId: song.songId, data, preview})
		return song
	}
	function parseMusicFile(file){
		return {
			songId: nanoid(),
			dataReady: false,
			src: URL.createObjectURL(file), 
			fileName: file.name, 
			title: file.name.split(".").slice(0, -1).join(".")
		}
	}
	async function getSongInfo(file, song){
		// console.time('songData')
		let image = await Api.searchSongImage(song.title)
		let duration = await getSongDuration(file) 
		// console.timeEnd('songData')
		return {image, duration, dataReady: true}
	}
	function getSongDuration(file){
		// let toTimeString = seconds => `${seconds/60|0}:${Math.round(seconds%60)}`
		let toTimeString = seconds => `${seconds/60|0}:${seconds%60|0}`
		return new Promise((resolve, reject) => {
			let reader = new FileReader();
			reader.onload = function (event) {
				let ctx = new (window.AudioContext || window.webkitAudioContext)();
				ctx.decodeAudioData(event.target.result, function(buffer) {
					let time = toTimeString(buffer.duration)
					time += time.length === 3 ? 0 : ''
					resolve(time);
				})
			}
			reader.readAsArrayBuffer(file);
		})
	}
}



function MusicItem({song, currSongId, setCurrSong}){
	const isPlaying = song.songId == currSongId
	function select(){
		// console.log('song ', song)
		setCurrSong(song.songId)
	}
	return(
		<li onclick={select} class={`music-row ${isPlaying && 'selected'}`} title={song.title}>
			<img class="song-img" src={song.image ? song.image : "./assets/sidePanel/controls/music_icon.svg"}/>
			<div class="song-info">
				{/* <div class="artist">Artist</div> */}
				<div class="song-title">{song.title}</div>
				<div class="song-time">
					{/* { true ?  */}
				{!song.dataReady ? 
					<Loader/>:
					// 'loading...':
					song.duration
				}
				</div>
			</div>
		</li>
	)
}

function Options({allowShare, autoPlay, toggle}){
	const options = 
	[{text:['Allow ','Share'], name: 'allowShare', value: allowShare}, {text:'Auto-Play', name:'autoPlay', value: autoPlay}]
	return (
		<div class="options">
		{	
		options.map( (option) => (
			<div class="option-item">
				<label for={option.id} class="toggle-wrapper"
					title={option.text == 'Share' ? 'Allow music sharing with room' : 'Auto-play new/next song in queue'}>
					{	typeof option.text === "object" ?
						<span class="toggle-text"> 
							<span class='hide-mobile'>{option.text[0]}</span>
							{option.text[1]} 
						</span> :
						<span class="toggle-text"> {option.text} </span>
					}
					<div class="toggle">
						<input onchange={_=> toggle(option.name)} checked={option.value} id={option.id} type="checkbox"/>
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

function Loader(){
	return (
	<div class="loader">
		<svg version="1.1" xmlns="http://www.w3.org/2000/svg"  x="0px" y="0px"
			width="24px" height="30px" viewBox="0 0 24 30" style="enable-background:new 0 0 50 50;">
			<rect x="0" y="10" width="4" height="10" fill="#333" opacity="0.2">
			<animate attributeName="opacity" attributeType="XML" values="0.2; 1; .2" begin="0s" dur="0.6s" repeatCount="indefinite" />
			<animate attributeName="height" attributeType="XML" values="10; 20; 10" begin="0s" dur="0.6s" repeatCount="indefinite" />
			<animate attributeName="y" attributeType="XML" values="10; 5; 10" begin="0s" dur="0.6s" repeatCount="indefinite" />
			</rect>
			<rect x="8" y="10" width="4" height="10" fill="#333"  opacity="0.2">
			<animate attributeName="opacity" attributeType="XML" values="0.2; 1; .2" begin="0.15s" dur="0.6s" repeatCount="indefinite" />
			<animate attributeName="height" attributeType="XML" values="10; 20; 10" begin="0.15s" dur="0.6s" repeatCount="indefinite" />
			<animate attributeName="y" attributeType="XML" values="10; 5; 10" begin="0.15s" dur="0.6s" repeatCount="indefinite" />
			</rect>
			<rect x="16" y="10" width="4" height="10" fill="#333"  opacity="0.2">
			<animate attributeName="opacity" attributeType="XML" values="0.2; 1; .2" begin="0.3s" dur="0.6s" repeatCount="indefinite" />
			<animate attributeName="height" attributeType="XML" values="10; 20; 10" begin="0.3s" dur="0.6s" repeatCount="indefinite" />
			<animate attributeName="y" attributeType="XML" values="10; 5; 10" begin="0.3s" dur="0.6s" repeatCount="indefinite" />
			</rect>
		</svg>
	</div>
	)
}



// Return next object key
function next(obj, key) {
	var keys = Object.keys(obj), 
	i = keys.indexOf(key);
	return i !== -1 && keys[i + 1] && obj[keys[i + 1]];
};

function getRawSongData(file) {
	return new Promise((resolve, reject)=>{
		var reader = new FileReader();
		var rawData = new ArrayBuffer();            
		reader.loadend = function() {}
		reader.onload = function(e) {
			rawData = e.target.result;
			// console.log('rawData ', {rawData})
			resolve(rawData)
		}
		reader.readAsArrayBuffer(file);
	})
}


// bufferToBase64: https://stackoverflow.com/a/52929849/8723748
function convertDataURIToBinary(dataURI) {
	var BASE64_MARKER = ';base64,';
	var base64Index = dataURI.indexOf(BASE64_MARKER) + BASE64_MARKER.length;
	var base64 = dataURI.substring(base64Index);
	var raw = window.atob(base64);
	var rawLength = raw.length;
	var array = new Uint8Array(new ArrayBuffer(rawLength));
  
	for(i = 0; i < rawLength; i++) {
		array[i] = raw.charCodeAt(i);
	}
	return array;
}
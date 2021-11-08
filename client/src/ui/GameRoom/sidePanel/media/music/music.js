import { h } from 'hyperapp';
import Api from '../../../../../api/Api';
import { nanoid } from 'nanoid/non-secure'
import { delay } from "nanodelay";
import Options from "../options"; 
l=1
const options = Options()

export default (initial) => ({
	state: {
		options: options.state,
		selectedFile: null,
		songList: {},
		currSongId: 0,
		isLoading: false,
		isPreviewing: false,
		songPreview: {
			ID: "",
			src: null,
			title: "",
			fileName: "",
			image: "",
			duration: "",
			dataReady: false,
			fromServer: false,
		},
	},
	actions: {
		options: options.actions,
		startLoading: (_) => (_) => ({ isLoading: true }),
		stopLoading: (_) => (_) => ({ isLoading: false }),
		setSelectedFile: (file) => (_) => ({ selectedFile: file }),
		setProcessing: (val) => (_) => ({ isProcessing: val }),
		addSong: (song) => (state) => {
			debuggger;
			let ID = song.ID;
			if (ID && state.songList[ID]) return {}; // not reachable ids always diff; compare names instead
			// let {songList, currSongId, autoPlay, isPreviewing} = state
			let play = state.options.autoPlay || !state.currSongId;
			return {
				// isLoading: autoPlay,
				songPreview: {}, // clear preview
				songList: { [ID]: { ID, ...song }, ...state.songList },
				currSongId: play ? ID : state.currSongId, // if autoplay, play new song
				isPreviewing: false,
			};
		},
		setSongData:
			({ ID, data, preview }) =>
			({ songList, songPreview }) =>
				preview
					? {
							songPreview: { ...songPreview, ...data },
							isLoading: false,
					  }
					: {
							songList: {
								...songList,
								[ID]: { ...songList[ID], ...data },
							},
					  },
		setCurrSong: (ID) => (_) => ({ currSongId: ID, isPreviewing: false }),
		setSongPreview: (song) => (state) => ({
			songPreview: song,
			isPreviewing: true,
		}),
		cancelPreview: (_) => (_) => ({
			isPreviewing: false,
			isLoading: false,
		}),

		getState:
			(_) =>
			({ songList, currSongId }) => ({ songList, currSongId }),
	},
	view:
		(state, actions) =>
		({ alert, mediaOpen }) => {
			const OptionsView = options.view(state.options, actions.options);
			let notEmpty = Object.getOwnPropertyNames(state.songList).length > 0;
			let songList = Object.values(state.songList);
			Api.setMessageHandlers({
				music: (message) => {
					if (!state.options.allowShare) return;
					if (!state.options.persistShareSetting)
						promptShare(message, alert, actions);
					else playSharedSong(message);
				},
			});
			async function playSharedSong({ song } = {}) {
				actions.addSong({ ...song, fromServer: true });
			}
			function promptShare(message, alert, actions) {
				let { options } = actions;
				// ID = '3vBwRfQbXkg'
				alert.show({
					role: "info",
					icon: "./assets/sidePanel/controls/music_icon.svg",
					heading: "Music Shared",
					message: "A user wants to share a song with you.",
					actions: {
						confirm: {
							text: "Allow",
							handler: (bool, persist) => {
								options.setShare({ bool, persist });
								playSharedSong(message);
							},
						},
						default: {
							text: "Deny",
							handler: (bool, persist) => {
								if (persist) options.setShare({ bool, persist });
							},
						},
					},
					dontAskAgain: false,
				});
			}
			const isMediaOpen = (type) => mediaOpen == type;
			return (
				<div
					class={`media-section music ${
						!isMediaOpen("music") && "no-pointers"
					}`}
				>
					<OptionsView type='music' />
					{/* <Options {...state} toggle={actions.toggle} /> */}
					<SongPlayer actions={actions} state={state} />

					{notEmpty && (
						<ul class="music-list">
							{songList.map((song, i) => (
								<MusicItem
									song={song}
									setCurrSong={actions.setCurrSong}
									currSongId={state.currSongId}
								/>
							))}
						</ul>
					)}
				</div>
			);
		},
});

function SongPlayer({ state, actions }){
	let {currSongId, isLoading, isPreviewing, songPreview, options, selectedFile, isProcessing} = state // should be consts
	let {setSongPreview, addSong, setSongData, startLoading, cancelPreview, setSelectedFile, setProcessing} = actions
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
		// todo: https://stackover3flow.com/questions/18299806/how-to-check-file-mime-type-with-javascript-before-upload
		let form = document.getElementsByTagName('form')[0] // todo: ensure is song form
		let song = songPreview;
		let file = selectedFile;
		if (isPreviewing) addSong(song)
		else { // a song has already been played, new songs no longer previewable
			file = setSelectedFile(form.song.files[0]).selectedFile
			song = await processSong(file) // sets songPreview
		}
		if (options.allowShare) {
			let songForm = new FormData();
			songForm.append("file", file);
			const { dataReady, src, ID, ...formData } = song
			Object.keys(formData).forEach((key) =>
				formData[key] && songForm.append(key, formData[key])
			);
			Api.shareSong(songForm);
		}
		form.reset()
		delay(500).then(_ =>  form.song.value = [])
	}
	return (
		<form class='song-form' name="song-form">
			<div class="song-player-wrapper">
				{isLoading && <Loader />}
				{isPlaying ? (
					<Song {...actions} {...state} />
				) : (
					<div class="song-preview-wrapper">
						<input
							onchange={preview}
							class={`file-input ${
								isPreviewing && "no-pointers"
							}`}
							id="song"
							name="song"
							type="file"
							accept="audio/*"
							disabled={isPreviewing}
						/>
						{/* <p class='invalid-message'>Song exceeds 10 mb file limit</p>  */}
						{isPreviewing ? (
							<Preview
								song={songPreview}
								cancelPreview={cancelPreview}
							/>
						) : (
							<Input />
						)}
					</div>
				)}
			</div>

			{(isPreviewing || isPlaying) && (
				<button
					onclick={!isPlaying ? submit : noop}
					class={`add-btn ${
						((!isLoading && isPreviewing) ||
							(!isPlaying && isPreviewing)) &&
						"preview"
					}`}
					disabled={isProcessing}
					type="button"
				>
					{isPlaying && (
						<input
							onchange={submit}
							class="file-input"
							id="song"
							name="song"
							type="file"
							accept="audio/*"
						/>
					)}
					<span class="add-icon">
						<img src="./assets/create/add.svg"/>
					</span>
					<span class="add-text">
						{isPreviewing ? "Play" : "Add Song"}
					</span>
				</button>
			)}
		</form>
	);	
	function Song({currSongId, songList, options, setCurrSong, getState}){
		const song = songList[currSongId]
		let bgImage = song.image
			? `background-image: url(${song.image})`
			: `background-image: url('../assets/sidePanel/controls/music_icon.svg')`;
		function handleSongEnd(audio){
			// console.log('audio el',audio)
			audio.addEventListener('ended', () => { 
				if (options.autoPlay) {
					let { songList, currSongId } = getState();
					let nextSong = next(songList, currSongId);
					if (nextSong) setCurrSong(nextSong.ID);
				}
			}, false);
		}
		function togglePlay(){
			var audio = document.getElementById("song-audio");
			audio.paused ? audio.play() : audio.pause();
		}
		return(
			<div onclick={togglePlay} class="song-container" style={bgImage} title={song.title}>
				<div class='song-title'>{song.title}</div>
				<div class="audio-wrapper">
					<audio oncreate={handleSongEnd} src={song.src} id="song-audio" controls autoplay>
						<source src={song.src}/>
					</audio>
				</div>
			</div>
		)
	}
	function Preview({song, cancelPreview}){
		const previewImage = song.image
			? `background-image: url(${song.image})`
			: "background-image: url(./assets/sidePanel/controls/music_icon.svg)"
		const cancel = _=>{
			let form = document.getElementsByTagName('form')[0] // todo: ensure is song form
			form.song.value = []
			cancelPreview()
		}
		return (
			<div
				class="song-container"
				style={previewImage}
				title={song.fileName}
			>
				<div class="song-title">{song.title}</div>
				<div class="trash-icon">
					<img onclick={cancel} src="../assets/create/cancel.svg" />
				</div>
			</div>
		);
	}
	function Input(){
		return(
			<div class="song-input cursor-pointer">
				<img class='input-icon' src="../assets/sidePanel/controls/add_music.svg"/>	
				<div class='input-text'>
					<span class='btn'>Choose</span>
					<span class='text'> or drag music file here</span>
					<span class='text mobile'> music file</span>
				</div>
				{/* <img src="http://placekitten.com/200/300"/> */}
			</div>
		)
	}
	// SongPlayer Component Utilities
	async function processSong(file, preview){
		let song = parseMusicFile(file)
		if (preview) setSongPreview(song)
		else addSong(song)
		setProcessing(true)
		let data = await getSongInfo(file, song) // todo share song img along with song
		setProcessing(false)
		setSongData({ ID: song.ID, data, preview })
		return {...song, ...data}
	}
	function parseMusicFile(file){
		return {
			ID: nanoid(),
			dataReady: false,
			src: URL.createObjectURL(file), 
			fileName: file.name, 
			title: file.name.split(".").slice(0, -1).join(".")
		}
	}
	async function getSongInfo(file, song){
		// console.time('getSongData')
		let [ image, duration ] = await Promise.all([
			Api.searchSongImage(song.title),
			getSongDuration(file) 
		])
		// console.timeEnd('getSongData')
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
					time += time.length === 3 ? 0 : '' // truncate time to 3 digits
					resolve(time);
				})
			}
			reader.readAsArrayBuffer(file);
		})
	}
}

function MusicItem({song, currSongId, setCurrSong}){
	const isPlaying = song.ID == currSongId
	function select(){
		// console.log('song ', song)
		setCurrSong(song.ID)
	}
	return(
		<li onclick={select} class={`music-row ${isPlaying && 'selected'}`} title={song.title}>
			{/* color: https://www.iconfinder.com/icons/3049253/button_audio_interface_music_play_sound_video_icon */}
			<img class="song-img" src={song.image ? song.image : "./assets/sidePanel/controls/music_icon.svg"}/>
			<div class="song-info">
				{/* <div class="artist">Artist</div> */}
				<div class="song-title">{song.title}</div>
				<div class="song-time">
					{/* { true ?  */}
				{!song.dataReady && !song.fromServer ? 
					<Loader/>:
					// 'loading...':
					song.duration
				}
				</div>
			</div>
		</li>
	)
}


function Loader(){
	return (
	<div class="music-loader">
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
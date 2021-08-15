import { h } from 'hyperapp';
import Api from '../../../../../api/Api';
import { nanoid } from 'nanoid/non-secure'

//todo: check mime type before sending ay files
export default initial => ({
	state: {
		autoPlay: true,
		allowShare: true,
		persistShareSetting: false, // if false prompts user when video is shared
		currSongId: 0,
		songPreview: '',
		isLoading: false,
		songList: {},
		selectedFile: { 
			src: null,
			fileName: '',
			title: '',
		}
	},
	actions: { 
		addSong: song => state => {
			if (song.songId && state.songList[songId]) return {} // not reachable ids random
			let songId = song.songId || nanoid()
			let autoPlay = state.autoPlay || !state.currSongId 
			return {
				// isLoading: autoPlay,
				songList: { [songId]: { songId, ...song }, ...state.songList }, 
				currSongId: autoPlay ? songId : state.currSongId // if autoplay, play new video
			}
		}, 
		setSongData: songData => state => ({
			videoList: {...state.videoList, [videoData.video_id]: {dataReady: true, ...songData}}
		}),
		setCurrSong: songId => _=> ({currSongId: songId, isLoading: true}),
		setPreviewImage: src => _ => ({songPreview: src}),
		selectFile: e => state => ({
			selectedFile: {
				src: URL.createObjectURL(e.target.files[0]), 
				fileName: e.target.files[0].name, 
				title: e.target.files[0].name.split(".").slice(0, -1).join(".")
			}
		}),
		setShare: ({bool, persist}) => state => ({ allowShare: bool, persistShareSetting: persist}),
		toggle: option => state => ({ [option]: !state[option] }),
	},
	view: (state, actions) => ({gameId}) => {

		return (
			<div class="music-area text-neutral">
				{ !!state.currSongId &&
					<audio controls>
						<source src={state.songList[state.currSongId].src}/>
					</audio>
					// todo: move audio el to song controls
				}

				<SongInput {...actions} {...state}/>

				<ul class="music-table">
				{ Object.values(state.songList).map((song, i)=>(
					<MusicItem song={song} currSongId={state.currSongId} setCurrSong={actions.setCurrSong}/>
				))}
					{/* <MusicItem/> */}
					{/* <MusicItem/> */}
				</ul>
			</div>
		)
	}
})

function SongInput({currSongId, selectFile, selectedFile, setPreviewImage, songPreview, autoPlay, addSong}){
	let currSong = false
	let fileSelected = false
	
	async function preview(e){
		// todo: set err msg
		console.log('what we got here',e.target)
		let {selectedFile} = selectFile(e)
		// console.log('selected',selectedFile.title)
		// console.time('req')
		let preview = await Api.searchImagePreview(selectedFile.title)
		// console.timeEnd('req')
		// console.log('preview bicchhhh', preview)
		setPreviewImage(preview)
	}

	function playSelected(){ addSong({...selectedFile, coverImg:  songPreview}) }

	const previewSrc = `background-image: url(${songPreview})`

	return(
		<form>
			{ !currSong && 
			<div class='song-input-wrapper'>
				<input onchange={preview} class={`file-input ${songPreview && 'no-pointers'}`} id="song" name="song" type='file'/>
				{ songPreview ? 
				<div class="song-preview cursor-pointer" style={`${songPreview ? previewSrc :''}`} title={selectedFile.fileName}>
					<div class='preview-title'>{selectedFile.title}</div>
					{/* add cancel X */}
				</div> : 
				<div class="song-input cursor-pointer">
					<img class='input-icon' src="../assets/sidePanel/controls/add_music.svg"/>	
					<div class='input-text'><span>Choose</span> or drag music file here</div>
					{/* <img src="http://placekitten.com/200/300"/> */}
				</div>
				}
				{/* <p class='invalid-message'>Song exceeds 10 mb file limit</p>  */}
			</div>
			}	
			
			<button onclick={playSelected} class={`add-btn ${ (!currSong && songPreview) && 'preview'}`} 
					type={`${currSong ? 'submit': 'button'}`}>
				{ !!currSong && 
				<input onchange={preview} class='file-input' id="song" name="song" type='file' />
				}
				<img class="add-icon" src="./assets/sidePanel/controls/plus_music.svg"/>
				<span class='add-text'>
					{autoPlay || !currSongId ? "Listen" : 'Add Song'}
				</span>
			</button>
		</form>
	)	
}

function MusicItem({song, currSongId}){
	const isPlaying = song?.songId == currSongId
	console.log('song ',  song)
	return(
		<div class={`music-row ${isPlaying && 'selected'}`}>
			<img class="music-img" src={song?.coverImg ? song.coverImg : "./assets/sidePanel/controls/music_play.svg"}/>
			<div class="music-info">
				{/* <div class="artist">Artist</div> */}
				<div class="song-title">{song?.title}</div>
				<div class="time">5:00</div>
			</div>
		</div>
	)
}





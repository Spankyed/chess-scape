import { h } from 'hyperapp';
import Music from './music/music'; 
import Video from './video/video'; 
import Api from "../../../../api/Api";

const music = Music()
const video = Video()

export default initial => ({
	state: { 
		music: music.state,
		video: video.state,
		currMoveIdx: 0,
		mediaOpen: 'music'
	},
	actions: { 
		music: music.actions,
		video: video.actions,
		showMedia: (type) => () => ({mediaOpen: type}),
	},
	view: (state, {showMedia,...actions}) => ({alert}) => {
		const MusicView = music.view(state.music, actions.music)
		const VideoView = video.view(state.video, actions.video)

		const inputs = {
			music: ({song}) => ({ ...song, fromServer: true }),
			video: ({ videoId }) => videoId
		}
		const methods = { music: 'addSong', video: 'addVideo' }

		const handleMedia = (type) => (message) => {
			if (!state[type].options.allowShare) return;
			const playMedia = () => {
				showMedia(type);
				actions[type][methods[type]](inputs[type](message));
			};
			if (!state[type].options.persistShareSetting)
				promptShare(type, alert, actions[type].options, playMedia);
			else playMedia();
		};

		Api.setMessageHandlers({
			music: handleMedia('music'),
			video: handleMedia('video'),
		});

		function isOpen(type){ return state.mediaOpen == type }
		
		return (
			<div class="media">
				<div class="media-toggles">
					<button
						class={`${isOpen("music") && "active"} toggle`}
						onclick={(_) => showMedia("music")}
					>
						<img src="./assets/sidePanel/music.svg" />
						{/* <span>Play</span> */}
						Music
					</button>
					<button
						class={`${isOpen("video") && "active"} toggle`}
						onclick={(_) => showMedia("video")}
					>
						<img src="./assets/sidePanel/video.svg" />
						{/* <span>Play</span> */}
						Video
					</button>
				</div>

				{isOpen("music") ? (
					<MusicView mediaOpen={state.mediaOpen} />
				) : (
					<VideoView mediaOpen={state.mediaOpen} />
				)}
			</div>
		);
	}
})

function promptShare(type, alert, options, playMedia) {
	const capitalize = (s) => s && s[0].toUpperCase() + s.slice(1);
	// alternative video icon https://www.iconfinder.com/icons/291691/youtube_movie_play_video_film_logo_icon
	const iconsFileName = { music: "music_icon.svg", video: "yt_play.svg" };

	const icon = `./assets/sidePanel/controls/${iconsFileName[type]}`;
	const message = `A user wants to share a ${
		type == "music" ? "song" : "video"
	} with you.`;
	const heading = `${capitalize(type)} Shared`;

	alert.show({
		heading,
		role: "info",
		icon,
		message,
		actions: {
			confirm: {
				text: "Allow",
				handler: (bool, persist) => {
					options.setShare({ bool, persist });
					playMedia();
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
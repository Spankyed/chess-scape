import Api from "../../../api/Api";
import { delay } from "nanodelay";

// abort|abandon|resign|draw
export default {
	abort: (callback) => ({
		// alternative icon https://www.iconfinder.com/icons/291691/youtube_movie_play_video_film_logo_icon
		role: "game",
		// icon: "./assets/sidePanel/controls/yt_play.svg",
		heading: "Abort",
		message: "This match will be aborted.",
		actions: {
			confirm: {
				text: "Abort",
				handler: () => {
					Api.end("abort");
					delay(1000).then(callback);
				},
			},
			default: {
				text: "Stay",
				handler: () => {},
			},
		},
	}),
	abandon: (callback) => ({
		// alternative icon https://www.iconfinder.com/icons/291691/youtube_movie_play_video_film_logo_icon
		role: "game",
		// icon: "./assets/sidePanel/controls/yt_play.svg",
		heading: "Abandon",
		message: "You are abandoning the match.",
		actions: {
			confirm: {
				text: "Abandon",
				handler: () => {
					Api.end("abandon");
					delay(1000).then(callback);
				},
			},
			default: {
				text: "Stay",
				handler: () => {},
			},
		},
	}),
	resign: {
		// alternative icon https://www.iconfinder.com/icons/291691/youtube_movie_play_video_film_logo_icon
		role: "game",
		// icon: "./assets/sidePanel/controls/yt_play.svg",
		heading: "Resign",
		message: "Please confirm your resignation.",
		actions: {
			confirm: {
				text: "Resign",
				handler: Api.end.bind(null, ["resign"]),
			},
			default: {
				text: "Stay",
				handler: () => {},
			},
		},
	},
	offerDraw: {
		// alternative icon https://www.iconfinder.com/icons/291691/youtube_movie_play_video_film_logo_icon
		role: "game",
		// icon: "./assets/sidePanel/controls/yt_play.svg",
		heading: "Draw",
		message: "Please confirm draw offer.",
		actions: {
			confirm: {
				text: "Draw",
				handler: Api.offerDraw,
			},
			default: {
				text: "Deny",
				handler: () => {},
			},
		},
	},
	draw: {
		// alternative icon https://www.iconfinder.com/icons/291691/youtube_movie_play_video_film_logo_icon
		role: "game",
		// icon: "./assets/sidePanel/controls/yt_play.svg",
		heading: "Draw",
		message: "Your opponent offered a draw.",
		actions: {
			confirm: {
				text: "Accept",
				handler: Api.end.bind(null, ["draw"]),
			},
			default: {
				text: "Deny",
				handler: () => {},
			},
		},
	},
};

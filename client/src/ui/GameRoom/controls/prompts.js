import Api from "../../../api/Api";
import { delay } from "nanodelay";

// abort|abandon|resign|draw
export default {
	abort: (callback) => ({
		id: "abort",
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
		id: "abandon",
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
	// offerDraw: {
	// 	// alternative icon https://www.iconfinder.com/icons/291691/youtube_movie_play_video_film_logo_icon
	// 	role: "game",
	// 	// icon: "./assets/sidePanel/controls/yt_play.svg",
	// 	heading: "Draw",
	// 	message: "Please confirm draw offer.",
	// 	actions: {
	// 		confirm: {
	// 			text: "Draw",
	// 			handler: Api.offerDraw,
	// 		},
	// 		default: {
	// 			text: "Deny",
	// 			handler: () => {},
	// 		},
	// 	},
	// },
	offered(type) {
		const capitalize = (s) => s && s[0].toUpperCase() + s.slice(1);
		const message =
			type == "draw"
				? "Opponent would like to draw the match."
				: "Opponent would like a rematch";
		return {
			// icon: "./assets/create/host.svg",
			id: type,
			role: "game",
			heading: `${capitalize(type)} Offered`,
			message,
			actions: {
				confirm: {
					text: "Accept",
					handler: (bool, persist) => {
						// setShare({ bool, persist });
						Api[type](true);
					},
				},
				default: {
					text: "Deny",
					handler: (bool, persist) => {
						Api[type](false);
					},
				},
			},
		};
	},
	onRematch: {
		// icon: "./assets/create/host.svg",
		id: "onRematch",
		role: "none",
		heading: "Rematch Agreed",
		message: "A new match will begin shortly.",
		time: 300
	}
};

import { h } from 'hyperapp';
import Api from '../../api/Api';

export default (initial) => ({
	state: {
		// ratings: ["Uncultured", "Beginner", "Skilled", "Professional"],
		ratings: ["Newbie", "Beginner", "Skilled", "Professional"],
		// ratings: ["Beginner", "Skilled", "Professional"],
		username: "",
		rating: "Beginner",
		attemptingSubmit: false,
		submitText: "PLAY",
		error: { status: "", message: "", show: false },
	},
	actions: {
		setUsername: (e) => (_) => ({
			username: e.target.value.replace(/[^a-zA-Z0-9-_]/g, ""),
		}),
		setRating: (rating) => () => ({ rating }),
		attemptSubmit: () => ({
			attemptingSubmit: true,
			submitText: "...",
			error: { show: false },
		}),
		endAttempt: () => ({
			attemptingSubmit: false,
			submitText: "PLAY",
			username: "",
		}),
		showError:
			({ status, message }) =>
			(_) => ({
				error: { status, message, show: true },
			}),
	},
	view:
		(state, actions) =>
		({ authorize, isAuthorized }) => {
			const attemptSubmit = async (e) => {
				e.preventDefault();
				let { username, rating } = state;
				let valid = validate(username);
				if (valid) {
					try {
						actions.attemptSubmit();
						let client = await Api.createClient({
							username,
							rating,
						});
						if (client) authorize();
						actions.endAttempt();
					} catch (err) {
						console.log(err);
						if (!err.hidden) actions.showError(err);
						actions.endAttempt();
					}
				}
			};
			return (
				<div class="entrance">
					<div class="banner">
						<img class="mobile" src="./assets/mobile/banner.svg" />
						<img src="./assets/banner.svg" />
					</div>
					<div class="user-pic">
						<div class="user-bg"></div>
						<img
							src={`https://avatars.dicebear.com/api/avataaars/${
								state.username || "dicebear"
							}.svg`}
						/>
					</div>
					<div class="user-form">
						<form onsubmit={attemptSubmit} action="">
							<div class="username">
								<label for="username" class="sr-only">
									Username
								</label>
								<input
									oninput={actions.setUsername}
									value={state.username}
									type="text"
									id="username"
									name="username"
									aria-label="Username"
									placeholder="Player 1"
									minlength="1"
									maxlength="27"
									autofocus
								/>
							</div>
							<div class="rating">
								<div class="rating-menu">
									{state.ratings.map((option) => (
										<div
											class={`rating-option 
										${option == state.rating && "selected"}`}
											onclick={() =>
												actions.setRating(option)
											}
										>
											{option}
										</div>
									))}
								</div>
							</div>
							{/* class= {`part save w-full bg-green-400 ${ state.attemptingSubmit && "processing" }`} */}
							<button
								type="submit"
								class={`save  ${
									state.attemptingSubmit && "processing"
								}`}
								disabled={!(state.username.length > 0)}
							>
								{state.attemptingSubmit ? (
									<Loader />
								) : (
									<div class="submit-text">
										<span class="text">{state.submitText}</span>
										<span class="line"></span>
									</div>
								)}
							</button>
						</form>
					</div>
				</div>
			);
		},
});

function validate(username) {
	illegalChars = /[^a-zA-Z0-9-_]/g.test(username);
	return !illegalChars && username.length > 0 && username.length < 27;
}

function Loader() {
	return (
		<img src="./assets/entrance/load-dots.svg" alt="Please Wait"/>
	);
}
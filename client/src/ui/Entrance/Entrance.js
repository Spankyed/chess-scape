import { h } from 'hyperapp';
import Api from '../../api/Api';

export default (initial) => ({
	state: {
		ratings: ["Newbie", "Beginner", "Skilled", "Professional"],
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
			// submitText: "Please wait...",
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
		({ authorize }) => {
			const attemptSubmit = async (e) => {
				e.preventDefault();
				let { username, rating } = state
				let valid = validate(username);
				if (valid) {
					try {
						actions.attemptSubmit();
						let client = await Api.createClient({username, rating});
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
					<form onsubmit={attemptSubmit} class="user-form" action="">
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
								state.submitText
							)}
						</button>
					</form>
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
		<svg
			version="1.1"
			id="L5"
			xmlns="http://www.w3.org/2000/svg"
			x="0px"
			y="0px"
			viewBox="0 0 100 100"
			enable-background="new 0 0 0 0"
		>
			<circle fill="#fff" stroke="none" cx="6" cy="50" r="6">
				<animateTransform
					attributeName="transform"
					dur="1s"
					type="translate"
					values="0 15 ; 0 -15; 0 15"
					repeatCount="indefinite"
					begin="0.1"
				/>
			</circle>
			<circle fill="#fff" stroke="none" cx="30" cy="50" r="6">
				<animateTransform
					attributeName="transform"
					dur="1s"
					type="translate"
					values="0 10 ; 0 -10; 0 10"
					repeatCount="indefinite"
					begin="0.2"
				/>
			</circle>
			<circle fill="#fff" stroke="none" cx="54" cy="50" r="6">
				<animateTransform
					attributeName="transform"
					dur="1s"
					type="translate"
					values="0 5 ; 0 -5; 0 5"
					repeatCount="indefinite"
					begin="0.3"
				/>
			</circle>
		</svg>
	);
}
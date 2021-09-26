import { h } from 'hyperapp';
import Api from '../../api/Api';

export default (initial) => ({
	state: {
		username: "",
		attemptingSubmit: false,
		submitText: ". . .",
		error: { status: "", message: "", show: false },
		imgSeed: "dicebear",
	},
	actions: {
		setUsernameAndSeed: (e) => (_) => ({
			username: e.target.value,
			imgSeed: e.target.value.replace(/[^a-zA-Z0-9-_]/g, ""),
		}),
		attemptSubmit: () => ({
			attemptingSubmit: true,
			submitText: "Please wait...",
			error: { show: false },
		}),
		endAttempt: () => ({
			attemptingSubmit: false,
			submitText: "Join Lobby",
		}),
		showError:
			({ status, message }) =>
			(_) => ({
				error: { status: status, message: message, show: true },
			}),
	},
	view:
		(state, actions) =>
		({ authorize }) => {
			const attemptSubmit = async (e) => {
				e.preventDefault();
				let valid = validate(state.username);
				if (valid) {
					try {
						actions.attemptSubmit();
						let clientId = await Api.setUser(state.username);
						if (clientId) authorize();
						actions.endAttempt();
					} catch (err) {
						console.log(err);
						if (!err.hidden) actions.showError(err);
						actions.endAttempt();
						// check for auth err status 401
					}
				}
			};

			return (
				<div
					class="entrance flex flex-wrap justify-center min-h-screen font-sans text-gray-100"
					style=""
				>
					<img
						class="w-full"
						src="./assets/banner.svg"
						style="max-height: 150px;"
					/>
					<form
						onsubmit={attemptSubmit}
						class="video-form w-4/6 max-h-screen"
						action=""
					>
						<div
							class="part flex h-44 items-center w-full rounded-small"
							style="background-color: #32291d"
						>
							<img
								class="w-full h-full"
								src={`https://avatars.dicebear.com/api/avataaars/${state.imgSeed}.svg`}
							/>
						</div>
						<div class="part w-full flex items-center  border-b">
							<label for="username" class="sr-only">
								Username
							</label>
							<input
								oninput={actions.setUsernameAndSeed}
								value={state.username}
								type="text"
								class="appearance-none bg-transparent border-none w-full py-1 px-2 leading-tight focus:outline-none"
								id="username"
								name="username"
								aria-label="Username"
								placeholder="Player 1"
								minlength="1"
								maxlength="27"
								autofocus="true"
							/>
						</div>

						<div class="part rating">
							<div class="w-2/5 self-start px-2">Rating :</div>
							<div class="rating-menu w-3/5 flex flex-wrap p-2">
								{[
									"Newb",
									"Beginner",
									"Skilled",
									"Professional",
								].map((option) => (
									<div
										class={`px-2 rating-option  ${
											option == "Skilled" && "selected"
										}`}
									>
										{option}
									</div>
								))}
							</div>
						</div>

						<button
							type="submit"
							class="part save w-full bg-green-400"
						>
							{state.submitText}
						</button>
					</form>
				</div>
			);
		},
});

function validate(username){
	return username.length > 0 &&  username.length < 13
}

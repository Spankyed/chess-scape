import { h } from "hyperapp";
import { delay } from "nanodelay";
import debounce from "tiny-debounce";
import Api from "../../../api/Api";

const initialState = {
	roomID: 0,
	pin: null,
	pinOpen: false,
	attemptingSubmit: false,
	incorrect: false,
	submitText: "Join",
};

export default (initial) => ({
	state: initialState,
	actions: {
		openPinInput: (roomID) => ({ pinOpen: true, roomID }),
		// closePinInput: () => ({ pinOpen: false }),
		attemptSubmit: () => ({
			attemptingSubmit: true,
			submitText: "...",
			incorrect: false,
		}),
		endAttempt: () => ({
			attemptingSubmit: false,
			submitText: "Join",
		}),
		setPin: (pin) => () => ({ pin, incorrect: false }),
		setIncorrect: (val) => () => ({ incorrect: val }),
		reset: () => initialState,
	},
	view:
		(state, actions) =>
		({ joinRoom }) => {
			const {
				roomID,
				submitText,
				pinOpen,
				pin,
				attemptingSubmit,
				incorrect,
			} = state;
			const attemptJoin = async (ev) => {
				ev.preventDefault();
				ev.stopPropagation();
				if (attemptingSubmit || !pinOpen) return;
				try {
					actions.attemptSubmit();
					const { valid } = await Api.joinPrivate({ pin, roomID }) || {}; // dont update room list with response, websocket message will be sent to update lobby roomlist
					if (valid) {
						joinRoom(roomID);
						delay(1).then(actions.endAttempt).then(actions.reset);

					} else {
						actions.setIncorrect(true);
						delay(1).then(actions.endAttempt)
					}
				} catch (err) {
					console.log(err);
					// if (!err.valid) actions.showError(err);
					delay(300).then(actions.endAttempt);
				}
			};

			const close = () => actions.reset();

			return (
				<div class={`pin-form-wrapper modal ${!pinOpen && "hide-pin"}`}>
					<div onclick={close} class="modal-overlay"></div>
					<form onsubmit={attemptJoin} action="" autocomplete="off">
						<div class="pin-form">
							<PinProtect
								{...{
									pin,
									attemptingSubmit,
									setPin: actions.setPin,
									incorrect,
								}}
							/>
							<Footer
								{...{
									attemptingSubmit,
									submitText,
									close,
									pin,
								}}
							/>
						</div>
					</form>
				</div>
			);
		},
});


function PinProtect({ pin, setPin, incorrect }) {
	// const focusInput = (ev) => ev.currentTarget.querySelector("input").focus();
	return (
		<div class="pin-input-wrapper">
			<span class="identity">
				<span class='lock'/>
			</span>
			<label for="pin" class="sr-only">
				Private
			</label>

			{/* <div class="private" onclick={focusInput}>
				Private
			</div> */}

			<div class={`pin-input ${incorrect && "incorrect"}`}>
				<Pin {...{ pin, setPin }} />
			</div>
		</div>
	);
}

function Pin({ pin, setPin, attemptingSubmit }) {
	return (
		<input
			name="pin"
			oninput={(e) => setPin(e.target.value)}
			value={pin}
			type="text"
			maxlength="4"
			placeholder="Pin"
			class="value"
			disabled={attemptingSubmit}
		></input>
	);
}

function Footer({ close, submitText, attemptingSubmit, pin }) {
	return (
		<div class="pin-form-footer">
			<button
				disabled={pin}
				type="submit"
				class={`join  ${attemptingSubmit && "processing"}`}
				disabled={attemptingSubmit}
			>
				{submitText}
			</button>
			<button onclick={close} type="button" class="cancel">
				Cancel
			</button>
		</div>
	);
}
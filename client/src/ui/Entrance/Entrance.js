import { h } from 'hyperapp';
import Api from '../../api/Api';

export default initial => ({
	state: { 
		username: '',
		attemptingSubmit: false,
		submitText: 'Join Lobby',
		error: { status: '', message: '', show: false }
	},
	actions: { 
		setUsername: e => _=> ({username: e.target.value}),
		attemptSubmit: () => ({ attemptingSubmit: true, submitText: 'Please wait...', error: { show: false }}),
		endAttempt: () => ({ attemptingSubmit: false, submitText: 'Join Lobby' }),
		showError: ({status, message}) => _ =>  ({ error: { status: status, message: message, show: true }}),
	},
	view: (state, actions) => ({authorize}) => {
		const attemptSubmit = async (e) => {
			e.preventDefault()
			let valid = validate(state.username)
			if (valid){
				try {  
					actions.attemptSubmit()
					let clientId = await Api.setUser(state.username)
					if (clientId) authorize()
					actions.endAttempt()
				} catch (err) {
					console.log(err); 
					if(!err.hidden) actions.showError(err)
					actions.endAttempt()
					// check for auth err status 401
				}
			}
		}
		return ( 
			<div class="entrance flex pt-10 justify-center min-h-screen bg-gray-900 font-sans">
				<form onsubmit={attemptSubmit} class="video-form" action="">
					<label for="username">Username</label>
					<input oninput={actions.setUsername} value={state.username} class="" type="text" name="username" placeholder="Player 1" id="username" maxlength="12" minlength="1" autofocus="true" aria-label="username" required/>
					<button type='submit' class="submit-button"> {state.submitText} </button>
				</form>
			</div>
		)
	}
})

function validate(username){
	return username.length > 0 &&  username.length < 13
}

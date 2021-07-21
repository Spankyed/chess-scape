import { h } from 'hyperapp';
// import './lobby.scss';
import Api from '../../api/Api';



export default initial => ({
	state: { 
	},

	actions: { 
	},

	view: (state, actions) => ({joinGame}) => {

		const init = () => {
		}


		return ( 
			<div oncreate={init} class="entrance flex pt-10 justify-center min-h-screen bg-gray-900 font-sans">
			</div>
		)
	}
})


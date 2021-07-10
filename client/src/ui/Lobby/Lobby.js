import { h } from 'hyperapp';
// import Scene from '../../core/Scene';
import './lobby.scss';


export default initial => ({
	state: { 
		gameRooms: []
	},

	actions: { 
	},

	view: ({}, actions) => ({authorize}) => {

		return ( 
			<div>
				<div>lobby (sign-in/rooms)</div> 
			</div>
		)
	}
})

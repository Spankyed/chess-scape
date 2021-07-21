import { h } from 'hyperapp';
// import Api from '../../../../api/Api';

export default initial => ({
	state: { 
		currMoveIdx: 0,
	},
	actions: { 
	},
	view: (state, actions) => ({}) => {
		return (
			<div class="moves h-full text-lg">
				<div class="move-list">

				</div>
			</div>
		);
	}
})

function Move({move,idx}){
	return (
		<row>
		</row>
	)
}


function gRI(arr) {
	return arr[Math.floor(Math.random() * arr.length)];
}
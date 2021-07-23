import { h } from 'hyperapp';
// import Api from '../../../../api/Api';

export default initial => ({
	state: { 
		currMoveIdx: 0,
	},
	actions: { 
		showMedia: (type, force) => (state) => ({mediaOpen: type}),
	},
	view: (state, actions) => ({}) => {
		// thumbnail: https://img.youtube.com/vi/<video-id>/0.jpg
		return (
			<div class="pt-3 text-sm text-neutral">
				<span class="text-xs md:text-base">
				You can invite up to 2 additional users on the Free plan. There is no limit on
				team members for the Premium plan.
				</span>
			</div>
		)
	}
})

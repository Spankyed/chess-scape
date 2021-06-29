import { h } from 'hyperapp';

//components
import Chat from '../components/Chat'; 
import Scene from '../../core/Scene';

const view = (state, actions) => {

	const { chatting, empty, clips, timeline } = state;

	const init = (canvas) => {
		Scene.setup(canvas, actions);
		canvas.focus();
	};
	
	return (
		<div>
			<canvas oncreate={init} id="renderCanvas"></canvas> 
			{
				chatting ? <Chat state={state} actions={actions}></Chat> : ""
			}
		</div>

	);
};

export default view;
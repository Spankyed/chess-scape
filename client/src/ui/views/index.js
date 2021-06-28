import { h } from 'hyperapp';

//components
import Chat from '../components/Chat'; 
import Scene from '../../core/Scenes';

const view = (state, actions) => {

	const { chatting, empty, clips, timeline } = state;

	const init = () => {
		Scene.setup(actions);
		document.getElementById("renderCanvas").focus();
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
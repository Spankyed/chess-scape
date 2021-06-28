import { app } from 'hyperapp'; // do we need h? - no we didnt, only import app
import view from './views/index';
import { state, actions } from './actions/index';
//import state from './states';
import { withLogger } from "@hyperapp/logger";
import './styles/index.css'; //import our css to be bundled

export const App = app(state, actions, view, document.body); //withLogger(app)(state, actions, view, document.body);



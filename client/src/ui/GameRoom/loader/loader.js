import { h } from 'hyperapp';
import { getRandomFact } from "./randomFacts";
import { delay } from "nanodelay";

// designs based off following code pens
// https://codepen.io/_fbrz/pen/KvwIF
// https://codepen.io/crayon-code/pen/eYdVLJo


export default (initial) => ({
	state: {
		loaderText: "",
		isLoading: true,
		removed: false,
	},
	actions: {
		setLoaderText: (text) => ({ loaderText: text }),
		showLoader: () => () => ({ isLoading: true }),
		hideLoader: () => () => ({ isLoading: false }),
		remove: () => () => ({ removed: true }),
	},
	view:
		({ isLoading, loaderText, removed }, { setLoaderText, remove }) =>
		() => {
			if (!loaderText) {
				setLoaderText(getRandomFact());
			} else if (!isLoading && !removed) {
				delay(1).then(remove);
			}
			return (
				<div class={`loader ${removed && "hide"}`}>
					<Mosaic />
					<div class="loader-wrapper">
						<h2>{loaderText || "Did you know?"}</h2>
					</div>
				</div>
			);
			
		},
});

function Mosaic() {
	return (
		<div class="mosaic">
			<div class="cell d-0"></div>
			<div class="cell d-1"></div>
			<div class="cell d-2"></div>
			<div class="cell d-3"></div>
			<div class="cell d-1"></div>
			<div class="cell d-2"></div>
			<div class="cell d-3"></div>
			<div class="cell d-4"></div>
			<div class="cell d-2"></div>
			<div class="cell d-3"></div>
			<div class="cell d-4"></div>
			<div class="cell d-5"></div>
			<div class="cell d-3"></div>
			<div class="cell d-4"></div>
			<div class="cell d-5"></div>
			<div class="cell d-6"></div>
		</div>
	);
}
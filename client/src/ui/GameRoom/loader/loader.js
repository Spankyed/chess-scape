import { h } from 'hyperapp';

// designs based off following code pens
// https://codepen.io/_fbrz/pen/KvwIF
// https://codepen.io/crayon-code/pen/eYdVLJo
export default () => {
	return (
		<div class="mosaic absolute top-0 left-0 w-full h-full" style="background-color:#302E2B; z-index:999;">
			<div class="relative"  style="height:50px">
				<div id="container">
					<div id="loader"></div>
				</div>
			</div>

			<div class="mosaic-loader">
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
			<h2> LOADING </h2>

		</div>
	);
};




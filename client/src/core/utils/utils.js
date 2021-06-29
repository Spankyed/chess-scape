function startEngine(canvas){
	let engine = 
	engine.runRenderLoop(function(){
		scene.render();
	});

	scene.debugLayer.show({ embedMode: true }).then(() => {
		// scene.debugLayer.select(light);
	});


	
	return engine
}
export default {
	startEngine
};
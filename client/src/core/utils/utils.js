function mapChessPieces(meshes){

	return {
		pawns:  [],
		rooks: [],

	}

}

BABYLON.AbstractMesh.prototype.addPickingBox = function(){
	var _this = this;
	if(!_this || _this._pickingBox !== undefined) return;

	var bounds = _this.getBoundingInfo().boundingBox.extendSize.clone();
    bounds = bounds.multiplyByFloats(2, 2, 2).clone();
	// console.log('bounds',bounds)

	_this._pickingBox = BABYLON.Mesh.CreateBox(_this.name +'_pBox', 1, _this._scene);
	let pBox = _this._pickingBox

	pBox.setPivotMatrix(BABYLON.Matrix.Translation(0, .5, 0)); // translate box origin to bottom of box
	
	pBox.scaling = bounds
	// pBox.scaling = new BABYLON.Vector3(2, bounds.y, 2)

	// var vectorsWorld = _this.getBoundingInfo().boundingBox.vectorsWorld; 
	// var height = Number(vectorsWorld[1].y-(vectorsWorld[0].y))
	// console.log(_this.name +' vectorsWorld',vectorsWorld)
	// pBox.scaling.y = height

	pBox.parent = _this;
	// pBox.position = _this.position.clone()
	// pBox.setAbsolutePosition(new BABYLON.Vector3(pBox.parent.position.x, 0, pBox.parent.position.z));
	pBox.visibility = 0.0; //0.0001;
	pBox._isPickingBox = true;
	_this.isPickable = false;
	pBox.isPickable = true;

	// console.log('mom',pBox.parent)

	return _this;
};


export default {
	mapChessPieces
};
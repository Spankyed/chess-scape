export default class Board {
    constructor(scene, canvas){
        this.scene = scene;  
        this.canvas = canvas;  
        this.grid = { 'h' : 8, 'w' : 8 };  
        this.squares = {}
        this.board = this.createBoard()
        this.startingPoint;  
        this.currentMesh;  
        return this.setup(scene,canvas)
    }
    
    setup (scene, canvas) {
        let ground = this.board
        var listeners = {
            pointerDown: this.onPointerDown(scene, ground, canvas),
            pointerUp: this.onPointerUp(scene, ground, canvas),
            pointerMove: this.onPointerMove(scene, ground)
        }
        canvas.addEventListener("pointerdown", listeners.pointerDown, false);
        canvas.addEventListener("pointerup", listeners.pointerUp, false);
        canvas.addEventListener("pointermove", listeners.pointerMove, false);
        scene.onDispose = function () {
            canvas.removeEventListener("pointerdown", listeners.pointerDown);
            canvas.removeEventListener("pointerup", listeners.pointerUp);
            canvas.removeEventListener("pointermove", listeners.pointerMove);
        }
    
        return scene;
    };

    onPointerDown(scene, ground, canvas) {
        return (evt) => {
            if (evt.button !== 0) {
                return;
            }
            // check if we are under a mesh : todo: check if mesh is a piece
            var pickInfo = scene.pick(scene.pointerX, scene.pointerY, function (mesh) { return mesh !== ground; });
            if (pickInfo.hit) {
                this.currentMesh = pickInfo.pickedMesh;
                console.log('mesh',this.currentMesh)
                if(this.currentMesh.id == 'box'){return;}
                this.startingPoint = this.getGroundPosition(scene, ground);
                if (this.startingPoint) { // remove this once camera controls changed to arrow keys
                    // setTimeout(function () {
                    //     camera.detachControl(canvas);
                    // }, 0);
                }
            }
        }
    }

    onPointerUp(scene, ground, canvas) {
        return () => {
            if (this.startingPoint) {
                var closestSq = this.getNearestSqCenter(scene, ground).sq;
                if (!closestSq) { 
                    this.startingPoint = null;
                    return; 
                }
                // if (!legalPieceMoves.includes(closestSq)) { 
                //     this.currentMesh.position = this.startingPoint; 
                //     this.startingPoint = null;
                // } else {
                //     var current = this.squares[closestSq].coords
                //     this.currentMesh.position = new BABYLON.Vector3(current.x, this.currentMesh.position.y, current.z)
                //     this.startingPoint = current;
                //     this.startingPoint = null;
                // }

                var current = this.squares[closestSq].coords
                this.currentMesh.position = new BABYLON.Vector3(current.x, this.currentMesh.position.y, current.z)
                this.startingPoint = current;
                this.startingPoint = null;


                return;
            }
        }
    }

    onPointerMove (scene, ground) {
        return(evt)=>{
            if (!this.startingPoint) {
                return;
            }
    
            var current = this.getGroundPosition(scene, ground);
    
            if (!current) {
                return;
            }
    
            var diff = current.subtract(this.startingPoint);
            this.currentMesh.position.addInPlace(diff);
    
            this.startingPoint = current;
        }
    }

    getNearestSqCenter(scene, ground){
        let pickedPoint = this.getGroundPosition(scene, ground)
        var closest = {sq:'a1', dist:99}; // why 99
        for (const sq in this.squares) {
            let dist = BABYLON.Vector3.Distance(pickedPoint, this.squares[sq].coords)
            if (dist < closest.dist){
                closest = {sq: sq, dist: dist}
            }            
        }
        console.log('closest point', closest)
        return closest
    }

    getGroundPosition (scene, ground) {
        // Use a predicate to get position on the ground
        var pickinfo = scene.pick(scene.pointerX, scene.pointerY, function (mesh) { return mesh == ground; });
        if (pickinfo.hit) {
            return pickinfo.pickedPoint;
        }

        return null;
    }

    calcDistance(p1,p2){
        return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2)
    }



    createBoard(){
        const tiledGround = new BABYLON.MeshBuilder.CreateTiledGround("Tiled Ground", {xmin: -8, zmin: -8, xmax: 8, zmax: 8, subdivisions: this.grid});
        const whiteMaterial = new BABYLON.StandardMaterial("White");
        whiteMaterial.diffuseColor = new BABYLON.Color3(0.97, 0.98, 0.85);
        whiteMaterial.specularColor = new BABYLON.Color3(0, 0, 0);

        const blackMaterial = new BABYLON.StandardMaterial("Black");
        blackMaterial.diffuseColor = new BABYLON.Color3(0.50, 0.64, 0.35);
        blackMaterial.specularColor = new BABYLON.Color3(0, 0, 0);

        tiledGround.position = new BABYLON.Vector3(0,.33,0)

        var box = BABYLON.Mesh.CreateBox("box", 16, this.scene);
        box.position = new BABYLON.Vector3(0, 0, 0);
        box.scaling.y = .04;
        box.material = whiteMaterial;

        const multimat = new BABYLON.MultiMaterial("multi", this.scene);

        // multimat.diffuseColor = new BABYLON.Color3(0.8, 0.8, 0.8);
        // multimat.specularColor = new BABYLON.Color3(0.5, 0.5, 0.5);
        // multimat.specularPower = 32;

        multimat.subMaterials.push(blackMaterial);
        multimat.subMaterials.push(whiteMaterial);
        tiledGround.material = multimat;
       
        // Needed variables to set subMeshes
        const verticesCount = tiledGround.getTotalVertices();
        const tileIndicesLength = tiledGround.getIndices().length / (this.grid.w * this.grid.h);
        // Set subMeshes of the tiled ground
        tiledGround.subMeshes = [];
        let base = 0;
        let logs = 0
        let yCoord = -7
        for (let row = 0; row < this.grid.h; row++) {
            let xCoord = -7
            for (let col = 0; col < this.grid.w; col++) {
                let square = new BABYLON.SubMesh(row % 2 ^ col % 2,  0, verticesCount, base , tileIndicesLength, tiledGround)
                this.squares[`${String.fromCharCode(col + 97)}${row}`] = {coords:new BABYLON.Vector3(xCoord, 0, yCoord), subMesh:square}
                tiledGround.subMeshes.push(square);
                base += tileIndicesLength;
                logs += 1
                // console.log('(col,row)', `(${col},${row})`,)
                // console.log('file-rank',`${String.fromCharCode(col + 97)}${row}`)
                // console.log(`coords ${xCoord},${yCoord}`)
                // console.log('______________________')
                xCoord += 2
            }
            yCoord += 2
        }

        console.log('squares',this.squares)
        return tiledGround
    }
    


}


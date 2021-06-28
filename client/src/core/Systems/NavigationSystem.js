import  System  from '../Systems/System';

var Navigation = require("babylon-navigation-mesh"); //import 'babylon-navigation-mesh';

export class NavigationSystem extends System {
    constructor(scene) {
        super('Navigation')
        this.scene = scene;
        this.navMesh = scene.getMeshByName("Navmesh");
        this.navigation = new Navigation();
        this.zoneNodes = this.navigation.buildNodes(this.navMesh);
        this.navigation.setZoneData('level', this.zoneNodes);
    }
    test(entity){
        return entity.hasComponents('Action', 'Navigation');
    }
    update(entity) {
        if(entity.moving){
            entity.path = entity.path || this.getPath(entity)
            this.moveObject(entity)
        }
    }
    /*-------------- (System Functions) --------------*/
    getPath(entity) {
        let group = this.navigation.getGroup('level', entity.mesh.parent.position);
        let path = this.navigation.findPath(entity.mesh.parent.position, entity.destination, 'level', group) || [];
        if (path.length > 0) entity.destination = path[0];
        return path;
    }
    moveObject(entity) {
        // move to clicked coordinates then stop entity
        // check and set action states
        if (entity.destination) {

            var moveVector = entity.destination.subtract(entity.mesh.parent.position);//parent position is being changed, not entity

            if (moveVector.length() > 0.1) {
                moveVector = moveVector.normalize();//get unit vector
                moveVector = moveVector.scale(0.05);//speed scaler
                entity.mesh.parent.moveWithCollisions(moveVector);//move entity

            } else if (entity.path.length > 0) {
                
                entity.path.shift();
                if (entity.path[0]) {
                    entity.destination = entity.path[0];
                } else {
                    entity.moving = false;
                    entity.path = null; //noclip if path remains defined
                    entity.destination = null; 
                    entity.startingPoint = null; //not being used
                    entity.trigger('stop');
                    //entity.distanceToTarget = null;      
                }
            }
            //two lines below redundant?
            var moveVectorNormalized = moveVector.normalize();
            var finalMoveVector = moveVectorNormalized.scale(1);

            var v1 = new BABYLON.Vector3(0,0,1);
            var v2 = moveVectorNormalized;

            //cosθ = a ⋅ b  ⋅/⋅  |a||b|
            var productVector = BABYLON.Vector3.Dot(v1, v2);
            var productLength = v1.length() * v2.length();
            var angle = Math.acos(productVector / productLength);

            // rotate avatar; should only do if entity needs to rotate
            if (!isNaN(angle)) {

                if (moveVectorNormalized.x < 0) angle = angle * -1;

                // calculate both angles in degrees
                var angleDegrees = Math.round(angle * 180/Math.PI);
                var playerRotationDegress = Math.round(entity.mesh.rotation.y * 180/Math.PI);

                // calculate the delta
                var deltaDegrees = playerRotationDegress - angleDegrees;

                // check what direction to turn to take the shotest turn
                if (deltaDegrees > 180){
                    deltaDegrees = deltaDegrees - 360;
                } else if (deltaDegrees < -180){
                    deltaDegrees = deltaDegrees + 360;
                }

                var rotationSpeed = Math.round(Math.abs(deltaDegrees)/8);
                if  (deltaDegrees > 0){
                    entity.mesh.rotation.y -= rotationSpeed * Math.PI/180;
                    if (entity.mesh.rotation.y < -Math.PI){
                        entity.mesh.rotation.y = Math.PI;
                    }
                }
                if (deltaDegrees < 0 ) {
                    entity.mesh.rotation.y += rotationSpeed * Math.PI / 180;
                    if (entity.mesh.rotation.y > Math.PI){
                        entity.mesh.rotation.y = -Math.PI;
                    }
                } 
            } else {
                console.log('You shouldnt be here..');
            }
        } else {
            debugger;
            console.error('No destination to move to');
        }
    }

}

import System from './System';

export class MoveSystem extends System {
    constructor(scene) {
        super('Action');
        this.time;
        this.scene = scene;
        this.enableUserInput()
        this.player = scene.manager._ecs.getEntityById('player')
    }
    test(entity){
        return entity.hasComponents('Action');
    }
    update(entity) {
        /*if(entity.state.transition){
            entity.updateAction();
            //check if action interface needs to hide
        }*/
    }
    /*-------------- (System Functions) --------------*/
    disableUserInput() {
        this._inputAllowed = false;
    }
    enableUserInput() {
        //scene.onPointerUp has many handlers, use document.addEventListener('pointerup')?
        if(this.inputAllowed == null) this.scene.onPointerUp = (evt) => { if (this._inputAllowed) this.pointerDown(evt) }
        this._inputAllowed = true;
    }
    pointerDown(evt){
        let scene = this.scene;
        let pickResult = scene.pick(scene.pointerX, scene.pointerY);
        if (pickResult.pickedMesh == scene.getMeshByName("Navmesh")) {       
            this.player.trigger( 'move', pickResult.pickedPoint.clone()) //player.perform
        } else {
            this.showActionMenu(pickResult.pickedMesh, scene)
        }
    }
    showActionMenu(mesh, scene){
        if (mesh){
            let position = getMousePos(scene)
            let entity = scene.manager._ecs.getEntityByMesh(mesh)
            let actions = this.getActions(entity)
            scene.interface.showInteract(position, entity, actions)
        } else return false;

        function getMousePos(scene) {      
            let engine = scene.getEngine() 
            return {
                left: (scene.pointerX - (engine.getRenderWidth() - 50) *0.5) + "px",   // scale mouse coordinates after they have
                top: (scene.pointerY - (engine.getRenderHeight() - 90) *0.5) + "px"     // been adjusted to be relative to element
            }
        }
    }
    getActions(entity){
        //clone entity.actions
        let actions = []
        if(entity){ // todo: when page first loads function is called with entity = false     
            for(let action in entity.actions.public){
                if(action == 'talk'){
                    actions.push({
                        text: entity.actions.public[action].text,
                        handler:() => {
                            entity.trigger(action)
                            this.scene.instance.openChat(entity)
                        }
                    })
                } else {
                    actions.push({
                        text: entity.actions.public[action].text,
                        handler:() => entity.trigger(action)
                    })
                }
            }  
        }
        //add 'move player here' to actions
        actions.push({ 
            text: 'Move Here', 
            handler: () => this.player.trigger('move', entity.mesh.position.clone()) //in handlers this == InterfaceManager
        })
        return actions;
    }
  
}

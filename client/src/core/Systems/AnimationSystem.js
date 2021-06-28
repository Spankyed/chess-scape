import System from './System';
import Utilities from '../utils/Utilities';

export class AnimationSystem extends System {

    constructor(scene){
        super('Animation');
        this.scene = scene;
        this._machine;
    }
    test(entity){
        return entity.hasComponents('Animation');
    }
    update(entity) {
        if(entity.transition){
            this.playAnimationClip(entity)
        } 
    }
    /*-------------- (System Functions) --------------*/

    /** Plays the specified animation clip by name on entity. */
    playAnimationClip(entity, loop = true, onAnimationEnd = null){
        let skeleton = entity.mesh.skeleton;
        let clip = entity.anims[entity.state];
        var animRange = skeleton.getAnimationRange(clip);
        entity.transition = false;
        //race condition somewhere, delay function call
        if (animRange) setTimeout(()=>{ this.scene.beginAnimation(skeleton, animRange.from, animRange.to, loop) }, 0);
    }
}



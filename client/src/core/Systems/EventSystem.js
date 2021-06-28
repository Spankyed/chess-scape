import System from './System';
import { animationFrameScheduler, interval, defer} from 'rxjs';
import { map, takeWhile } from 'rxjs/operators';

export class EventSystem extends System {
    constructor(scene) {
        super('Event');
        this.scene = scene;
        this.chatting = false;
        /*let that = this;
        $('#renderCanvas').keyup(function(event){
            if(event.keyCode === 't') { // when user presses t talk to nearest entity
              that.eventSystem.talkTo('nearest')
            }
        });*/
    }

    test(entity){
        let hasEvents = entity.hasComponents('Event');
        if(hasEvents){
            let that = this;
            //entity.actions.push(clip) //TODO: push clips to actions
        }
        return hasEvents;
    }
    update(entity) {
        /*if(this.chatting){
            //if(entity.stateChanged)
            this.time = scene.manager.time;
            this.state = {
                time: this.time,
                state: entity.state
            }
        }*/
    }

    /*-------------- (System Functions) --------------*/
    findClip(e){
        for (let i = 0; i < this.events; ++i) {
            const event = this.events[i];
            if (events.id === e) {
                return event;
            }
        }
        return false;
    }

    trigger(clip){
        //set initial positions
        let entities = clip.initials.entities;
        for (let i = 0; i < entities.length; ++i) {
            const entity = entities[i].entity;
            if(entity.id == 'player'){
                entity.mesh.parent.position = entities[i].startPosition.clone() //ALWAYS SET MESH'S PARENT POSITION
            } else {
                entity.mesh.position = entities[i].startPosition.clone() 
            }
            entity.mesh.rotation = entities[i].startRotation.clone()
            entity.mesh.scaling = entities[i].startScaling.clone()
        }

        const msElapsed = (scheduler = animationFrameScheduler) => {
            return defer(() => {
                const start = scheduler.now();
                return interval(0, scheduler)
                        .pipe(
                            map(() => scheduler.now() - start)
                        )
            })
        };
            
        const duration = (ms, scheduler = animationFrameScheduler) =>
            msElapsed(scheduler)
                .pipe(
                    takeWhile(t => t < ms)
                )
                		
        var lastIndex = clip.actions.length - 1; 		
        var endTime = clip.time + 200; // add 200 ms of padding
        
        let i = 0;
        duration(endTime)
            .subscribe((currTime) => { 
                // console.log('test frequency', endTime, time)
                if (i <= lastIndex){
                    //console.log('next clip @ ', clip.actions[i].time)
                    if (currTime >= (clip.actions[i].time)){
                        //console.log('playing back action ', clip.actions[i])
                        clip.actions[i].entity.trigger(...clip.actions[i].args, false)                   
                        i++
                    }
                }		
            })			
    }
  
}


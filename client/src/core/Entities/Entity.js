import Events from '../utils/Events';
//import fastSplice from './utils/fastSplice';
/**
 * Base class for characters and items. 
 * This class is not meant to be used directly and should be sub-classed to
 * define specific logic.
 *
 * @class
 */
export default class Entity {
    constructor(...args) {
        this.id = null; //'idOrGenerator.next()';

        this.components = args;

        this.systems = [];

        this.ecs = null;
        
        /**
         * Mixin Events
         */
        Events(this);
    }
    hasComponents(...components) {
        // Check that each passed component exists in the component list.
        // If it doesn't, then immediately return false.
        for (let i = 0; i < components.length; ++i) {

            let found = (this.components.indexOf(components[i]) > -1) ? true : false;
            //let found = (components[i] in this.components) ? true : false;

            if(!found){
                return false;
            }        
        }
        return true;
    }
    getSystem(name) {
        for (let i = 0; i < this.systems.length; ++i) {
            const system = this.systems[i];
            if (system.name === name) {
                return system;
            }
        }
        return null;
    }
    dispose() {
        while (this.systems.length) {
            this.systems[this.systems.length - 1].removeEntity(this);
        }
    }
   
    _addSystem(system) {
        this.systems.push(system);
    }

    _removeSystem(system) {
        const index = this.systems.indexOf(system);

        if (index !== -1) {
            fastSplice(this.systems, index, 1);
        }
    }
    /**
    * @param {...Component} components - Compose components into a base class (entity)
    * @return {Component} Component classes to extend base with.
    */
    static with(...components){ 
        return components.reduce((base, component) => component(base), this); //pass 'this' as initial value of reduce accumulator
    }
}
  

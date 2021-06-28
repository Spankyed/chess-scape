//import fastSplice from './utils/fastSplice';

/**
 * A system update all eligible entities at a given frequency.
 * This class is not meant to be used directly and should be sub-classed to
 * define specific logic.
 *
 * @class
 */
export default class System {
    /**
     *
     * @param {number} frequency Frequency of execution.
     */
    constructor(name, frequency = 1) {
        this.name = name;
        this.frequency = frequency;
        this.entities = [];
        this.enable = true;
    }

    addEntity(entity) {
        entity._addSystem(this);
        this.entities.push(entity);
        this.enter(entity);
    }

    removeEntity(entity) {
        const index = this.entities.indexOf(entity);
        if (index !== -1) {
            entity._removeSystem(this);
            //fastSplice(this.entities, index, 1);
            this.exit(entity);
        }
    }

    test(entity) { // eslint-disable-line no-unused-vars
        return false;
    }

    //initialize() {} // eslint-disable-line no-empty-function
    dispose() {
        for (let i = 0; i < this.entities.length; ++i) {
            this.entities[i]._removeSystem(this);
            this.exit(this.entities[i]);
        }
    }

    enter(entity) {} // eslint-disable-line no-empty-function,no-unused-vars
    exit(entity) {} // eslint-disable-line no-empty-function,no-unused-vars
    update(entity, elapsed) {} // eslint-disable-line no-empty-function,no-unused-vars
}

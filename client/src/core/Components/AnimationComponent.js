export const AnimationComponent = (Base) => class extends Base {
	constructor(...args) {
		super('Animation', ...args)
		this.skeleton;
		this._anims = [];
		this._events = {};
		this._state = {};
		this._transition = false;
	}
	get skeleton() { return this._skeleton; }
	set skeleton(v) { this._skeleton = v; }

	get anims() { return this._anims; }
	set anims(v) { this._anims = v; }
	
	//aka actions
	get events() { return this._events; }
	set events(v) { this._events = v; }

	get state() { return this._state; }
	set state(v) { this._state = v; }

	get transition() { return this._transition; }
	set transition(v) { this._transition = v; }


}
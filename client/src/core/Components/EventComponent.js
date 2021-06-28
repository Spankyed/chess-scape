export const EventComponent = (Base) => class extends Base {
	constructor(...args) {
		super('Event', ...args)

		//this._default = {};
		this._events = [];
		this._state = {};

	}

	get events() { return this._events; }
	set events(v) { this._events = v; }

	get state() { return this._state; }
	set state(v) { this._state = v; }
}
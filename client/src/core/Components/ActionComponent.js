export const ActionComponent = (Base) => class extends Base {
	constructor(...args) {
		super('Action', ...args)
		this._actions = {};
		this._interacting = false;
		this._state = 0;
	}
	// actions: [{ name, handler}]
	get actions() { return this._actions; }
	set actions(v) { this._actions = v; }

	get interacting() { return this._interacting; }
	set interacting(bool) { this._interacting = bool; }

	get state() { return this._state; }
	set state(v) { this._state = v; }
}

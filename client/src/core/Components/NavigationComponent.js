export const NavigationComponent = (Base) => class extends Base {
	constructor(...args) {
		super('Navigation', ...args)
		this._moving = false;
		this._startingPoint;
		this._destination;
		this._path = 0;
	}

	get moving() { return this._moving; }
	set moving(val) { this._moving = val; }

	get startingPoint() { return this._startingPoint; }
	set startingPoint(val) { this._startingPoint = val; }
	
	get destination() { return this._destination; }
	set destination(val) { this._destination = val; }

	get path() { return this._path; }
	set path(p) { this._path = p; }
}
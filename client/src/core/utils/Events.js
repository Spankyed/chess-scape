function Events() {
	var self = this;
	var _events = {};
	function addEventListener(type, handler) {
		if(typeof type === 'string' && typeof handler === 'function') {
			_events[type] = _events[type] || [];
			_events[type].push(handler);
		} else throw new Error('Invalid arguments to addEventListener(type, handler)');
		return self;
	}
	function removeEventListener(type, handler) {
		var idx = -1;
		if(_events[type] === undefined) return self;
		if(handler === undefined) {
			_events[type].length = 0;
		} else if((idx = _events[type].indexOf(handler)) !== -1) {
			_events[type].splice(idx, 1);
		} else console.log('Remove Listener, branch C');
		return self;
	}
	function dispatchEvent(event) {
		var type, args, handlers;
		if(typeof event === 'object' && typeof event.type === 'string') { // pass event object as args
			type = event.type;
			args = [event];
		} else if(typeof event === 'string') { // pass all params after first as args
			type = event;
			args = Array.prototype.slice.call(arguments, 1);
		} else throw new Error('Invalid arguments to dispatchEvent(...)' + event);
		if(!(handlers = _events[type]) || handlers.length === 0) return false; //event not found
		for(var i = 0, l = handlers.length; i < l; i++) {
			handlers[i].apply(self, args);
		}
		return true;
	}
	function getEventListeners(type) {
		if(type !== undefined) return _events;
		return _events[type];
	}
	Object.defineProperties(self, {
		// DOM naming convention
		addEventListener: { value: addEventListener, enumerable: true},
		removeEventListener: { value: removeEventListener, enumerable: true},
		dispatchEvent: { value: dispatchEvent, enumerable: true},
		// jQuery naming convention
		on: { value: addEventListener, enumerable: true},
		off: { value: removeEventListener, enumerable: true},
		trigger: { value: dispatchEvent, enumerable: true, writable: true},

		getEventListeners: { value: getEventListeners, enumerable: true},
	});
}

var mixin = function(obj){
	Events.apply(obj);
	return obj;
};

window.Events = mixin;

export default mixin;
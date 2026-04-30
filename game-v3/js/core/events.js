const GameEvents = {
    listeners: {},

    on(eventName, handler) {
        if (!eventName || typeof handler !== 'function') {
            return;
        }

        if (!this.listeners[eventName]) {
            this.listeners[eventName] = [];
        }

        this.listeners[eventName].push(handler);
    },

    off(eventName, handler) {
        const handlers = this.listeners[eventName];
        if (!handlers || handlers.length === 0) {
            return;
        }

        this.listeners[eventName] = handlers.filter(function (candidate) {
            return candidate !== handler;
        });
    },

    emit(eventName, payload) {
        const handlers = this.listeners[eventName];
        if (!handlers || handlers.length === 0) {
            return;
        }

        handlers.slice().forEach(function (handler) {
            try {
                handler(payload);
            } catch (error) {
                console.error("GameEvents handler error (" + eventName + "):", error);
            }
        });
    }
};

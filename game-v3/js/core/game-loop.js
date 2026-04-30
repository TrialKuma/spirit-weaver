const GameLoop = {
    running: false,
    paused: false,
    timeScale: 1.0,
    lastTimestamp: 0,
    updateCallbacks: [],
    _boundTick: null,

    start() {
        if (this.running) {
            this.paused = false;
            this.lastTimestamp = performance.now();
            return;
        }

        this.running = true;
        this.paused = false;
        this.lastTimestamp = performance.now();
        if (!this._boundTick) {
            this._boundTick = this._tick.bind(this);
        }
        requestAnimationFrame(this._boundTick);
    },

    stop() {
        this.running = false;
        this.paused = false;
        this.lastTimestamp = 0;
    },

    pause() {
        this.paused = true;
    },

    resume() {
        this.paused = false;
        this.lastTimestamp = performance.now();
        if (!this.running) {
            this.start();
        }
    },

    addUpdate(callback) {
        if (typeof callback !== "function") {
            return;
        }

        if (!this.updateCallbacks.includes(callback)) {
            this.updateCallbacks.push(callback);
        }
    },

    removeUpdate(callback) {
        this.updateCallbacks = this.updateCallbacks.filter(function (candidate) {
            return candidate !== callback;
        });
    },

    _tick(timestamp) {
        if (!this.running) {
            return;
        }

        if (!this.lastTimestamp) {
            this.lastTimestamp = timestamp;
        }

        let rawDt = (timestamp - this.lastTimestamp) / 1000;
        if (!Number.isFinite(rawDt) || rawDt < 0) {
            rawDt = 0;
        }

        const dt = Math.min(rawDt, 0.1) * this.timeScale;
        this.lastTimestamp = timestamp;

        if (!this.paused) {
            this.updateCallbacks.slice().forEach(function (callback) {
                try {
                    callback(dt);
                } catch (error) {
                    console.error("GameLoop update error:", error);
                }
            });
        }

        requestAnimationFrame(this._boundTick);
    }
};

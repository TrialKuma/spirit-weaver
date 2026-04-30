class Timer {
    constructor(duration, onComplete) {
        this.duration = Math.max(0, Number(duration) || 0);
        this.onComplete = typeof onComplete === "function" ? onComplete : null;
        this.elapsed = 0;
        this.completed = false;
    }

    update(dt) {
        if (this.completed) {
            return;
        }

        this.elapsed += Math.max(0, Number(dt) || 0);

        if (this.elapsed >= this.duration) {
            this.elapsed = this.duration;
            this.completed = true;
            if (this.onComplete) {
                this.onComplete();
            }
        }
    }

    reset(duration) {
        if (typeof duration === "number") {
            this.duration = Math.max(0, duration);
        }
        this.elapsed = 0;
        this.completed = false;
    }

    get progress() {
        if (this.duration <= 0) {
            return 1;
        }
        return Math.min(this.elapsed / this.duration, 1);
    }

    get remaining() {
        return Math.max(0, this.duration - this.elapsed);
    }

    get finished() {
        return this.completed || this.duration === 0;
    }
}

class Cooldown {
    constructor(duration) {
        this.duration = Math.max(0, Number(duration) || 0);
        this.timer = new Timer(this.duration);
        this.active = false;
        this.timer.completed = true;
    }

    start(duration) {
        if (typeof duration === "number") {
            this.duration = Math.max(0, duration);
            this.timer.duration = this.duration;
        }

        this.timer.reset(this.duration);
        this.active = true;
    }

    update(dt) {
        if (!this.active) {
            return;
        }

        this.timer.update(dt);
        if (this.timer.finished) {
            this.active = false;
        }
    }

    get ready() {
        return !this.active;
    }

    get remaining() {
        return this.active ? this.timer.remaining : 0;
    }

    get progress() {
        return this.active ? this.timer.progress : 1;
    }
}

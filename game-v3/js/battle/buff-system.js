class Buff {
    constructor(config) {
        const buffConfig = config || {};

        this.id = buffConfig.id || "buff_" + Math.random().toString(36).slice(2);
        this.name = buffConfig.name || this.id;
        this.type = buffConfig.type || "buff";
        this.stat = buffConfig.stat || "";
        this.value = Number(buffConfig.value) || 0;
        this.duration = typeof buffConfig.duration === "number" ? buffConfig.duration : 0;
        this.elapsed = 0;
        this.onApply = typeof buffConfig.onApply === "function" ? buffConfig.onApply : null;
        this.onExpire = typeof buffConfig.onExpire === "function" ? buffConfig.onExpire : null;
        this.onTick = typeof buffConfig.onTick === "function" ? buffConfig.onTick : null;
        this.tickInterval = Number(buffConfig.tickInterval) || 0;
        this.tickElapsed = 0;
        this.target = null;
    }

    update(dt) {
        if (this.duration >= 0) {
            this.elapsed += dt;
        }

        if (this.tickInterval > 0 && this.onTick) {
            this.tickElapsed += dt;
            while (this.tickElapsed >= this.tickInterval && !this.finished) {
                this.tickElapsed -= this.tickInterval;
                this.onTick(this.target, this);
            }
        }
    }

    get finished() {
        return this.duration >= 0 && this.elapsed >= this.duration;
    }

    get remaining() {
        if (this.duration < 0) {
            return Infinity;
        }
        return Math.max(0, this.duration - this.elapsed);
    }

    get progress() {
        if (this.duration <= 0) {
            return 1;
        }
        return Math.min(this.elapsed / this.duration, 1);
    }
}

class BuffManager {
    constructor(owner) {
        this.owner = owner;
        this.buffs = [];
    }

    addBuff(targetOrConfig, buffConfig) {
        const target = buffConfig ? targetOrConfig : this.owner;
        const config = buffConfig || targetOrConfig;

        if (!config || !config.id) {
            return null;
        }

        const existing = this.buffs.find(function (buff) {
            return buff.id === config.id;
        });

        if (existing) {
            existing.name = config.name || existing.name;
            existing.type = config.type || existing.type;
            existing.stat = config.stat || existing.stat;
            existing.value = typeof config.value === "number" ? config.value : existing.value;
            existing.duration = typeof config.duration === "number" ? config.duration : existing.duration;
            existing.elapsed = 0;
            existing.tickElapsed = 0;
            GameEvents.emit("buffRefreshed", { target: target, buff: existing });
            return existing;
        }

        const buff = config instanceof Buff ? config : new Buff(config);
        buff.target = target;
        this.buffs.push(buff);

        if (buff.onApply) {
            buff.onApply(target, buff);
        }

        GameEvents.emit("buffAdded", { target: target, buff: buff });
        return buff;
    }

    removeBuff(targetOrId, buffId) {
        const target = buffId ? targetOrId : this.owner;
        const id = buffId || targetOrId;
        const index = this.buffs.findIndex(function (buff) {
            return buff.id === id;
        });

        if (index < 0) {
            return null;
        }

        const buff = this.buffs[index];
        this.buffs.splice(index, 1);

        if (buff.onExpire) {
            buff.onExpire(target, buff);
        }

        GameEvents.emit("buffRemoved", { target: target, buff: buff });
        return buff;
    }

    update(dt) {
        for (let index = this.buffs.length - 1; index >= 0; index -= 1) {
            const buff = this.buffs[index];
            buff.update(dt);
            if (buff.finished) {
                this.removeBuff(this.owner, buff.id);
            }
        }
    }

    clear() {
        while (this.buffs.length > 0) {
            this.removeBuff(this.owner, this.buffs[0].id);
        }
    }

    getModifier(stat) {
        return this.buffs.reduce(function (sum, buff) {
            return buff.stat === stat ? sum + buff.value : sum;
        }, 0);
    }

    hasBuff(id) {
        return this.buffs.some(function (buff) {
            return buff.id === id;
        });
    }

    getBuff(id) {
        return this.buffs.find(function (buff) {
            return buff.id === id;
        }) || null;
    }
}

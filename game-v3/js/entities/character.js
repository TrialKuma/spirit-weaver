class Character {
    constructor(config) {
        const setup = config || {};

        this.name = setup.name || "单位";
        this.classId = setup.classId || "unit";
        this.hp = Number(setup.hp) || 1;
        this.maxHp = Number(setup.maxHp) || this.hp;
        this.baseAtk = Number(setup.baseAtk) || 0;
        this.def = Number(setup.def) || 0;
        this.speed = Number(setup.speed) || 100;
        this.critChance = typeof setup.critChance === "number" ? setup.critChance : 0.1;
        this.critMultiplier = typeof setup.critMultiplier === "number" ? setup.critMultiplier : 1.5;
        this.resources = {};
        this.skills = [];
        this.shield = 0;
        this.portrait = setup.portrait || "";
        this.buffManager = new BuffManager(this);
    }

    update(dt) {
        this.regenerateResources(dt);
        this.buffManager.update(dt);
    }

    regenerateResources(dt) {
        Object.keys(this.resources).forEach(function (resourceKey) {
            const resource = this.resources[resourceKey];
            if (!resource || !resource.regenPerSec) {
                return;
            }

            resource.val = Math.min(resource.max, resource.val + resource.regenPerSec * this.getSpeedRate() * dt);
        }, this);
    }

    takeDamage(amount) {
        let remaining = Math.max(0, Number(amount) || 0);

        if (this.shield > 0 && remaining > 0) {
            const absorbed = Math.min(this.shield, remaining);
            this.shield -= absorbed;
            remaining -= absorbed;
        }

        const damageToHp = Math.min(this.hp, remaining);
        this.hp = Math.max(0, this.hp - damageToHp);

        GameEvents.emit("hpChanged", { target: this, amount: -damageToHp });
        return damageToHp;
    }

    heal(amount) {
        const value = Math.max(0, Number(amount) || 0);
        if (value <= 0) {
            return 0;
        }

        const before = this.hp;
        this.hp = Math.min(this.maxHp, this.hp + value);
        const actual = this.hp - before;

        GameEvents.emit("hpChanged", { target: this, amount: actual });
        return actual;
    }

    getBuffedAtk() {
        return this.baseAtk * (1 + this.getBuffModifier("atk"));
    }

    getBuffModifier(stat) {
        return this.buffManager.getModifier(stat);
    }

    canAfford(cost) {
        const price = cost || {};
        return Object.keys(price).every(function (resourceKey) {
            const resource = this.resources[resourceKey];
            const required = Number(price[resourceKey]) || 0;
            return resource && resource.val >= required;
        }, this);
    }

    spendResource(cost) {
        const price = cost || {};
        Object.keys(price).forEach(function (resourceKey) {
            const resource = this.resources[resourceKey];
            const required = Number(price[resourceKey]) || 0;
            if (!resource) {
                return;
            }
            resource.val = Math.max(0, resource.val - required);
        }, this);
    }

    gainResource(resourceKey, amount) {
        const resource = this.resources[resourceKey];
        if (!resource) {
            return;
        }
        resource.val = Math.min(resource.max, resource.val + amount);
    }

    addBuff(config) {
        return this.buffManager.addBuff(this, config);
    }

    removeBuff(buffId) {
        return this.buffManager.removeBuff(this, buffId);
    }

    hasBuff(buffId) {
        return this.buffManager.hasBuff(buffId);
    }

    getBuff(buffId) {
        return this.buffManager.getBuff(buffId);
    }

    isGuarding() {
        return this.getGuardReduction() > 0;
    }

    getGuardReduction() {
        return Math.max(0, Math.min(0.9, this.getBuffModifier("guard")));
    }

    getAnimScale() {
        return 1 / this.getSpeedRate();
    }

    getSpeedRate() {
        const effectiveSpeed = Math.max(40, this.speed * (1 + this.getBuffModifier("speed")));
        return effectiveSpeed / 100;
    }

    onSkillHit() {
    }
}
